using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Auth;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;

namespace SPS.Application.Services;

/// <summary>
/// 認證服務實現
/// </summary>
public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITokenService _tokenService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IVerificationCodeService _verificationCodeService;
    private readonly ISystemSettingService _systemSettingService;
    private readonly IPasswordPolicyService _passwordPolicyService;
    private readonly IEmailService _emailService;
    private readonly IActionLogService _actionLogService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IUnitOfWork unitOfWork,
        ITokenService tokenService,
        IPasswordHasher passwordHasher,
        IVerificationCodeService verificationCodeService,
        ISystemSettingService systemSettingService,
        IPasswordPolicyService passwordPolicyService,
        IEmailService emailService,
        IActionLogService actionLogService,
        IConfiguration configuration,
        ILogger<AuthService> logger)
    {
        _unitOfWork = unitOfWork;
        _tokenService = tokenService;
        _passwordHasher = passwordHasher;
        _verificationCodeService = verificationCodeService;
        _systemSettingService = systemSettingService;
        _passwordPolicyService = passwordPolicyService;
        _emailService = emailService;
        _actionLogService = actionLogService;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// 會員登入
    /// </summary>
    public async Task<Result<TokenResponse>> LoginAsync(LoginRequest request, string? ipAddress = null, string? userAgent = null, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Login attempt for email: {Email}", request.Email);

        // 讀取安全性設定
        var securitySettingsResult = await _systemSettingService.GetSettingAsync<SecuritySettingsDto>("Security", cancellationToken);
        var securitySettings = securitySettingsResult.Data ?? new SecuritySettingsDto();

        // 查找會員
        var member = await _unitOfWork.Members.GetByEmailAsync(request.Email, cancellationToken);

        if (member == null)
        {
            _logger.LogWarning("Login failed: Member not found for email {Email}", request.Email);
            await _actionLogService.LogLoginAsync(
                userId: "",
                userName: request.Email,
                userType: "前台系統",
                isSuccess: false,
                loginMethod: "密碼",
                ipAddress: ipAddress,
                userAgent: userAgent,
                errorMessage: "會員不存在"
            );
            return Result<TokenResponse>.Failure("郵箱或密碼錯誤");
        }

        // 檢查帳戶是否被鎖定（依設定開關）
        if (securitySettings.EnableLoginLockout)
        {
            if (member.LockedTime.HasValue && member.LockedTime > DateTime.UtcNow)
            {
                var remaining = member.LockedTime.Value - DateTime.UtcNow;
                _logger.LogWarning("Login failed: Member {MemberId} is locked until {LockedTime}", member.Id, member.LockedTime);
                return Result<TokenResponse>.Failure($"帳戶已被鎖定，請 {Math.Ceiling(remaining.TotalMinutes)} 分鐘後再試");
            }

            // 如果鎖定時間已過，重置鎖定狀態
            if (member.LockedTime.HasValue && member.LockedTime <= DateTime.UtcNow)
            {
                member.LockedTime = null;
                member.LoginFailure = 0;
                if (member.Status == Status.Locked)
                {
                    member.Status = Status.Active;
                }
            }
        }

        // 檢查會員狀態
        if (member.Status != Status.Active)
        {
            _logger.LogWarning("Login failed: Member {MemberId} status is {Status}", member.Id, member.Status);
            return Result<TokenResponse>.Failure($"賬戶狀態異常: {member.Status}");
        }

        // 驗證密碼
        if (!_passwordHasher.Verify(request.Password, member.Password))
        {
            _logger.LogWarning("Login failed: Invalid password for email {Email}", request.Email);

            // 登入失敗鎖定機制（依設定開關）
            if (securitySettings.EnableLoginLockout)
            {
                member.LoginFailure++;
                _logger.LogInformation("Login failure count for member {MemberId}: {Count}", member.Id, member.LoginFailure);

                if (member.LoginFailure >= securitySettings.MaxFailedAttempts)
                {
                    member.LockedTime = DateTime.UtcNow.AddMinutes(securitySettings.LockoutDurationMinutes);
                    member.Status = Status.Locked;
                    _logger.LogWarning("Member {MemberId} locked due to too many failed attempts", member.Id);
                    await _unitOfWork.SaveChangesAsync(cancellationToken);
                    return Result<TokenResponse>.Failure($"登入失敗次數過多，帳戶已被鎖定 {securitySettings.LockoutDurationMinutes} 分鐘");
                }

                await _unitOfWork.SaveChangesAsync(cancellationToken);
                var remainingAttempts = securitySettings.MaxFailedAttempts - member.LoginFailure;
                return Result<TokenResponse>.Failure($"郵箱或密碼錯誤，剩餘 {remainingAttempts} 次嘗試機會");
            }

            await _actionLogService.LogLoginAsync(
                userId: member.Id.ToString(),
                userName: member.Nickname ?? member.Email,
                userType: "前台系統",
                isSuccess: false,
                loginMethod: "密碼",
                ipAddress: ipAddress,
                userAgent: userAgent,
                errorMessage: "密碼錯誤"
            );
            return Result<TokenResponse>.Failure("郵箱或密碼錯誤");
        }

        // 登入成功，重置失敗計數
        member.LoginFailure = 0;
        member.LockedTime = null;

        // 更新最后登入時間
        member.LoginTime = DateTime.UtcNow;
        member.LastVisitedTime = DateTime.UtcNow;

        // 生成 Token
        var tokenResponse = _tokenService.GenerateToken(member);

        // 保存 RefreshToken 到數據庫
        member.RefreshToken = tokenResponse.RefreshToken;
        member.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(7); // RefreshToken 有效期 7 天

        // 檢查是否需要修改密碼
        // 1. 後台強制要求修改密碼（個別會員設定，不受全域設定影響）
        //    或首次登入需修改密碼（依系統設定開關）
        if (!member.FirstChanged)
        {
            tokenResponse.RequirePasswordChange = true;
            tokenResponse.PasswordChangeReason = securitySettings.RequirePasswordChangeOnFirstLogin
                ? "首次登入，請修改密碼"
                : "管理員要求您修改密碼";
            _logger.LogInformation("Member {MemberId} requires password change (FirstChanged=false)", member.Id);
        }
        // 2. 密碼過期（依設定開關）
        else if (securitySettings.EnablePasswordExpiry && member.PasswordChangedTime.HasValue)
        {
            var passwordAge = DateTime.UtcNow - member.PasswordChangedTime.Value;
            if (passwordAge.TotalDays > securitySettings.PasswordExpiryDays)
            {
                tokenResponse.RequirePasswordChange = true;
                tokenResponse.PasswordChangeReason = "密碼已過期，請修改密碼";
                _logger.LogInformation("Member {MemberId} password expired", member.Id);
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 記錄登入成功
        await _actionLogService.LogLoginAsync(
            userId: member.Id.ToString(),
            userName: member.Nickname ?? member.Email,
            userType: "前台系統",
            isSuccess: true,
            loginMethod: "密碼",
            ipAddress: ipAddress,
            userAgent: userAgent
        );

        _logger.LogInformation("Login successful for member {MemberId}", member.Id);

        return Result<TokenResponse>.Success(tokenResponse);
    }

    /// <summary>
    /// 會員注冊
    /// </summary>
    public async Task<Result<TokenResponse>> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Registration attempt for email: {Email}", request.Email);

        // 檢查郵箱是否已存在
        var emailExists = await _unitOfWork.Members.ExistsByEmailAsync(request.Email, cancellationToken);
        if (emailExists)
        {
            _logger.LogWarning("Registration failed: Email {Email} already exists", request.Email);
            return Result<TokenResponse>.Failure("該郵箱已被注冊");
        }

        // 驗證密碼策略
        var policyResult = await _passwordPolicyService.ValidatePasswordAsync(request.Password, cancellationToken);
        if (!policyResult.IsSuccess)
        {
            return Result<TokenResponse>.Failure(policyResult.Error!);
        }

        // 創建會員
        var member = new Member
        {
            Id = Guid.NewGuid(),
            Number = $"M{DateTime.UtcNow:yyyyMMddHHmmss}",
            Email = request.Email,
            Phone = request.Phone,
            Extension = request.Extension,
            MobilePhone = request.MobilePhone,
            Password = _passwordHasher.Hash(request.Password),
            Nickname = request.Name,
            CompanyId = request.CompanyId,
            Status = Status.Active,
            LoginTime = DateTime.UtcNow,
            LastVisitedTime = DateTime.UtcNow,
            DataMode = DataMode.Normal,
            FirstChanged = false,
            PasswordChanged = false,
            LoginFailure = 0,
            PasswordExpirationPolicy = 0,
            CreatedTime = DateTime.UtcNow,
            UpdatedTime = DateTime.UtcNow
        };

        // 生成 Token
        var tokenResponse = _tokenService.GenerateToken(member);

        // 保存 RefreshToken 到數據庫
        member.RefreshToken = tokenResponse.RefreshToken;
        member.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(7); // RefreshToken 有效期 7 天

        // 保存會員
        await _unitOfWork.Members.AddAsync(member, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Registration successful for member {MemberId}", member.Id);

        return Result<TokenResponse>.Success(tokenResponse);
    }

    /// <summary>
    /// 刷新令牌
    /// </summary>
    public async Task<Result<TokenResponse>> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Refresh token attempt");

        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return Result<TokenResponse>.Failure("刷新令牌不能為空");
        }

        // 查找擁有此 RefreshToken 的會員
        var member = await _unitOfWork.Members.GetByRefreshTokenAsync(refreshToken, cancellationToken);

        if (member == null)
        {
            _logger.LogWarning("Refresh token not found or invalid");
            return Result<TokenResponse>.Failure("無效的刷新令牌");
        }

        // 檢查 RefreshToken 是否過期
        if (member.RefreshTokenExpiresAt == null || member.RefreshTokenExpiresAt <= DateTime.UtcNow)
        {
            _logger.LogWarning("Refresh token expired for member {MemberId}", member.Id);
            return Result<TokenResponse>.Failure("刷新令牌已過期，請重新登入");
        }

        // 檢查會員狀態
        if (member.Status != Status.Active)
        {
            _logger.LogWarning("Member {MemberId} status is {Status}", member.Id, member.Status);
            return Result<TokenResponse>.Failure($"賬戶狀態異常: {member.Status}");
        }

        // 生成新的 Token
        var tokenResponse = _tokenService.GenerateToken(member);

        // 更新 RefreshToken
        member.RefreshToken = tokenResponse.RefreshToken;
        member.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(7); // 延長 7 天
        member.LastVisitedTime = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Refresh token successful for member {MemberId}", member.Id);

        return Result<TokenResponse>.Success(tokenResponse);
    }

    /// <summary>
    /// 發送驗證碼
    /// </summary>
    public async Task<Result> SendVerificationCodeAsync(
        SendVerificationCodeRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Send verification code request for email: {Email}", request.Email);

        // 查找會員
        var member = await _unitOfWork.Members.GetByEmailAsync(request.Email, cancellationToken);
        if (member == null)
        {
            _logger.LogWarning("Send verification code failed: Member not found for email {Email}", request.Email);
            return Result.Failure("該郵箱未註冊");
        }

        // 發送驗證碼
        var result = await _verificationCodeService.SendCodeAsync(
            request.Email,
            member.Nickname ?? member.Email,
            request.Purpose,
            cancellationToken);

        return result;
    }

    /// <summary>
    /// 修改密碼（需驗證碼）
    /// </summary>
    public async Task<Result> ChangePasswordAsync(
        MemberChangePasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Change password request for email: {Email}", request.Email);

        // 查找會員
        var member = await _unitOfWork.Members.GetByEmailAsync(request.Email, cancellationToken);
        if (member == null)
        {
            _logger.LogWarning("Change password failed: Member not found for email {Email}", request.Email);
            return Result.Failure("該郵箱未註冊");
        }

        // 驗證驗證碼
        var verifyResult = await _verificationCodeService.VerifyCodeAsync(
            request.Email,
            request.VerificationCode,
            DTOs.Auth.VerificationCodePurpose.ChangePassword,
            cancellationToken);

        if (!verifyResult.IsSuccess)
        {
            return Result.Failure(verifyResult.Error ?? "驗證碼驗證失敗");
        }

        // 驗證密碼策略
        var policyResult = await _passwordPolicyService.ValidatePasswordAsync(request.NewPassword, cancellationToken);
        if (!policyResult.IsSuccess)
        {
            return Result.Failure(policyResult.Error!);
        }

        // 檢查新密碼是否與目前密碼相同
        if (_passwordHasher.Verify(request.NewPassword, member.Password))
        {
            return Result.Failure("新密碼不能與目前密碼相同");
        }

        // 更新密碼
        member.Password = _passwordHasher.Hash(request.NewPassword);
        member.PasswordChanged = true;
        member.FirstChanged = true;
        member.PasswordChangedTime = DateTime.UtcNow;
        member.UpdatedTime = DateTime.UtcNow;

        // 使驗證碼失效
        await _verificationCodeService.InvalidateCodeAsync(
            request.Email,
            DTOs.Auth.VerificationCodePurpose.ChangePassword,
            cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 記錄密碼變更
        await _actionLogService.LogAsync(new ActionLogEntry
        {
            ActionType = "PasswordChange",
            ActionName = "變更密碼",
            UserId = member.Id.ToString(),
            UserName = member.Nickname ?? member.Email,
            UserType = "前台系統",
            IsSuccess = true,
            Description = $"會員 {member.Nickname ?? member.Email} 變更密碼成功"
        });

        _logger.LogInformation("Password changed successfully for member {MemberId}", member.Id);

        return Result.Success();
    }

    /// <summary>
    /// 忘記密碼 - 發送重置密碼郵件
    /// </summary>
    public async Task<Result> ForgotPasswordAsync(
        ForgotPasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Forgot password request for email: {Email}", request.Email);

        // 查找會員
        var member = await _unitOfWork.Members.GetByEmailAsync(request.Email, cancellationToken);

        // 無論會員是否存在，都返回成功（防止帳號枚舉攻擊）
        if (member == null)
        {
            _logger.LogWarning("Forgot password: Member not found for email {Email}", request.Email);
            return Result.Success();
        }

        // 檢查會員狀態（允許被鎖定的會員透過重置密碼解鎖）
        if (member.Status != Status.Active && member.Status != Status.Locked)
        {
            _logger.LogWarning("Forgot password: Member {MemberId} status is {Status}", member.Id, member.Status);
            return Result.Success();
        }

        // 生成重置密碼 Token
        var resetToken = _tokenService.GenerateMemberPasswordResetToken(member.Id, member.Email);

        // 構建重置密碼連結
        var baseUrl = _configuration["App:BaseUrl"] ?? "http://localhost:3000";
        var resetLink = $"{baseUrl}/member/reset-password?token={Uri.EscapeDataString(resetToken)}";

        // 發送重置密碼郵件
        try
        {
            await _emailService.SendPasswordResetEmailAsync(member.Email, resetLink, member.Nickname ?? member.Email, 30);
            _logger.LogInformation("Password reset email sent to {Email}", request.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send password reset email to {Email}", request.Email);
            return Result.Failure("發送郵件失敗，請稍後再試");
        }

        return Result.Success();
    }

    /// <summary>
    /// 重置密碼 - 透過 Token 設定新密碼
    /// </summary>
    public async Task<Result> ResetPasswordAsync(
        MemberResetPasswordRequest request,
        string? ipAddress = null,
        string? userAgent = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Reset password attempt");

        // 驗證 Token
        var memberId = _tokenService.ValidateMemberPasswordResetToken(request.Token);
        if (memberId == null)
        {
            _logger.LogWarning("Reset password failed: Invalid or expired token");
            return Result.Failure("重置連結無效或已過期，請重新申請");
        }

        // 查找會員
        var member = await _unitOfWork.Members.GetByIdAsync(memberId.Value, cancellationToken);
        if (member == null)
        {
            _logger.LogWarning("Reset password failed: Member {MemberId} not found", memberId);
            return Result.Failure("會員不存在");
        }

        // 檢查會員狀態
        if (member.Status != Status.Active && member.Status != Status.Locked)
        {
            _logger.LogWarning("Reset password failed: Member {MemberId} status is {Status}", member.Id, member.Status);
            return Result.Failure("帳戶狀態異常，無法重置密碼");
        }

        // 驗證密碼策略
        var policyResult = await _passwordPolicyService.ValidatePasswordAsync(request.NewPassword, cancellationToken);
        if (!policyResult.IsSuccess)
        {
            return Result.Failure(policyResult.Error!);
        }

        // 檢查新密碼是否與目前密碼相同
        if (_passwordHasher.Verify(request.NewPassword, member.Password))
        {
            return Result.Failure("新密碼不能與目前密碼相同");
        }

        // 更新密碼
        member.Password = _passwordHasher.Hash(request.NewPassword);
        member.PasswordChanged = true;
        member.FirstChanged = true;
        member.PasswordChangedTime = DateTime.UtcNow;
        member.UpdatedTime = DateTime.UtcNow;

        // 清除鎖定狀態（如果有）
        member.LockedTime = null;
        member.LoginFailure = 0;
        if (member.Status == Status.Locked)
        {
            member.Status = Status.Active;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 記錄密碼重設
        await _actionLogService.LogAsync(new ActionLogEntry
        {
            ActionType = "PasswordReset",
            ActionName = "重設密碼",
            UserId = member.Id.ToString(),
            UserName = member.Nickname ?? member.Email,
            UserType = "前台系統",
            IpAddress = ipAddress,
            UserAgent = userAgent,
            IsSuccess = true,
            Description = $"會員 {member.Nickname ?? member.Email} 透過郵件重設密碼成功"
        });

        _logger.LogInformation("Password reset successfully for member {MemberId}", member.Id);

        return Result.Success();
    }

    /// <summary>
    /// 驗證重置密碼 Token 是否有效
    /// </summary>
    public async Task<Result<string>> ValidateResetTokenAsync(
        string token,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Validating member reset token");

        // 驗證 Token
        var memberId = _tokenService.ValidateMemberPasswordResetToken(token);
        if (memberId == null)
        {
            _logger.LogWarning("Token validation failed: Invalid or expired token");
            return Result<string>.Failure("重置連結無效或已過期");
        }

        // 查找會員
        var member = await _unitOfWork.Members.GetByIdAsync(memberId.Value, cancellationToken);
        if (member == null)
        {
            _logger.LogWarning("Token validation failed: Member {MemberId} not found", memberId);
            return Result<string>.Failure("會員不存在");
        }

        // 返回會員郵箱（用於前端顯示）
        return Result<string>.Success(member.Email);
    }
}