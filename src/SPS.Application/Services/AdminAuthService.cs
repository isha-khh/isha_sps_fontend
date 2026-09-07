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
/// 後台管理員認證服務實現
/// </summary>
public class AdminAuthService : IAdminAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITokenService _tokenService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IPasswordPolicyService _passwordPolicyService;
    private readonly ISystemSettingService _systemSettingService;
    private readonly IEmailService _emailService;
    private readonly IActionLogService _actionLogService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AdminAuthService> _logger;

    public AdminAuthService(
        IUnitOfWork unitOfWork,
        ITokenService tokenService,
        IPasswordHasher passwordHasher,
        IPasswordPolicyService passwordPolicyService,
        ISystemSettingService systemSettingService,
        IEmailService emailService,
        IActionLogService actionLogService,
        IConfiguration configuration,
        ILogger<AdminAuthService> logger)
    {
        _unitOfWork = unitOfWork;
        _tokenService = tokenService;
        _passwordHasher = passwordHasher;
        _passwordPolicyService = passwordPolicyService;
        _systemSettingService = systemSettingService;
        _emailService = emailService;
        _actionLogService = actionLogService;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// 檢查系統是否需要初始化
    /// </summary>
    public async Task<Result<SystemInitResponse>> CheckInitAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Checking system initialization status");

        var userCount = await _unitOfWork.Users.GetCountAsync(cancellationToken);

        var response = new SystemInitResponse
        {
            Init = userCount == 0,
            Message = userCount == 0
                ? "系統需要初始化，請創建首個管理員帳號"
                : "系統已初始化"
        };

        return Result<SystemInitResponse>.Success(response);
    }

    /// <summary>
    /// 註冊首個系統管理員（僅在沒有任何使用者時可用）
    /// </summary>
    public async Task<Result<AdminTokenResponse>> RegisterFirstAdminAsync(
        AdminRegisterRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Attempting to register first admin: {Account}", request.Account);

        // 檢查是否已有使用者
        var userCount = await _unitOfWork.Users.GetCountAsync(cancellationToken);
        if (userCount > 0)
        {
            _logger.LogWarning("Registration failed: System already initialized");
            return Result<AdminTokenResponse>.Failure("系統已初始化，無法再次創建首個管理員");
        }

        // 檢查帳號是否已存在
        var accountExists = await _unitOfWork.Users.ExistsByAccountAsync(request.Account, cancellationToken);
        if (accountExists)
        {
            _logger.LogWarning("Registration failed: Account {Account} already exists", request.Account);
            return Result<AdminTokenResponse>.Failure("該帳號已被使用");
        }

        // 檢查郵箱是否已存在
        if (!string.IsNullOrEmpty(request.Email))
        {
            var emailExists = await _unitOfWork.Users.ExistsByEmailAsync(request.Email, cancellationToken);
            if (emailExists)
            {
                _logger.LogWarning("Registration failed: Email {Email} already exists", request.Email);
                return Result<AdminTokenResponse>.Failure("該郵箱已被使用");
            }
        }

        // 驗證密碼策略
        var policyResult = await _passwordPolicyService.ValidatePasswordAsync(request.Password, cancellationToken);
        if (!policyResult.IsSuccess)
        {
            return Result<AdminTokenResponse>.Failure(policyResult.Error!);
        }

        // 創建系統管理員角色
        var adminRole = new Role
        {
            Id = Guid.NewGuid(),
            Name = "系統管理員",
            Description = "擁有所有系統權限",
            Permissions = UserPermission.All,
            DataMode = DataMode.Normal,
            CreatedTime = DateTime.UtcNow,
            UpdatedTime = DateTime.UtcNow
        };

        await _unitOfWork.Roles.AddAsync(adminRole, cancellationToken);

        // 創建使用者
        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Account = request.Account,
            Email = request.Email,
            Password = _passwordHasher.Hash(request.Password),
            Status = Status.Active,
            DataMode = DataMode.Normal,
            LoginTime = DateTime.UtcNow,
            LastVisitedTime = DateTime.UtcNow,
            FirstChanged = false,
            PasswordChanged = false,
            LoginFailure = 0,
            PasswordExpirationPolicy = 0,
            CreatedTime = DateTime.UtcNow,
            UpdatedTime = DateTime.UtcNow
        };

        // 分配角色
        user.UserRoles.Add(new UserRole
        {
            UserId = user.Id,
            RoleId = adminRole.Id
        });

        await _unitOfWork.Users.AddAsync(user, cancellationToken);

        // 生成 Token
        var tokenResponse = _tokenService.GenerateAdminToken(user);

        // 保存 Token 到數據庫
        user.Token = tokenResponse.RefreshToken;
        user.LoginTime = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("First admin created successfully: {UserId}", user.Id);

        return Result<AdminTokenResponse>.Success(tokenResponse);
    }

    /// <summary>
    /// 後台管理員登入
    /// </summary>
    public async Task<Result<AdminTokenResponse>> LoginAsync(
        AdminLoginRequest request,
        string? ipAddress = null,
        string? userAgent = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Admin login attempt for account: {Email}", request.Email);

        // 讀取安全性設定
        var securitySettingsResult = await _systemSettingService.GetSettingAsync<SecuritySettingsDto>("Security", cancellationToken);
        var securitySettings = securitySettingsResult.Data ?? new SecuritySettingsDto();

        // 查找使用者
        var user = await _unitOfWork.Users.GetByEmailAsync(request.Email, cancellationToken);

        if (user == null)
        {
            _logger.LogWarning("Login failed: User not found for account {Account}", request.Email);
            await _actionLogService.LogLoginAsync(
                userId: "",
                userName: request.Email,
                userType: "後台系統",
                isSuccess: false,
                loginMethod: "密碼",
                ipAddress: ipAddress,
                userAgent: userAgent,
                errorMessage: "使用者不存在"
            );
            return Result<AdminTokenResponse>.Failure("信箱或密碼錯誤");
        }

        // 檢查帳戶是否被鎖定（依設定開關）
        if (securitySettings.EnableLoginLockout)
        {
            if (user.LockedTime.HasValue && user.LockedTime > DateTime.UtcNow)
            {
                var remaining = user.LockedTime.Value - DateTime.UtcNow;
                _logger.LogWarning("Login failed: User {UserId} is locked until {LockedTime}", user.Id, user.LockedTime);
                return Result<AdminTokenResponse>.Failure($"帳戶已被鎖定，請 {Math.Ceiling(remaining.TotalMinutes)} 分鐘後再試");
            }

            // 如果鎖定時間已過，重置鎖定狀態
            if (user.LockedTime.HasValue && user.LockedTime <= DateTime.UtcNow)
            {
                user.LockedTime = null;
                user.LoginFailure = 0;
                if (user.Status == Status.Locked)
                {
                    user.Status = Status.Active;
                }
            }
        }

        // 檢查使用者狀態
        if (user.Status != Status.Active)
        {
            _logger.LogWarning("Login failed: User {UserId} status is {Status}", user.Id, user.Status);
            return Result<AdminTokenResponse>.Failure($"賬戶狀態異常: {user.Status}");
        }

        // 驗證密碼
        if (!_passwordHasher.Verify(request.Password, user.Password))
        {
            _logger.LogWarning("Login failed: Invalid password for account {Email}", request.Email);

            // 登入失敗鎖定機制（依設定開關）
            if (securitySettings.EnableLoginLockout)
            {
                user.LoginFailure++;
                _logger.LogInformation("Login failure count for user {UserId}: {Count}", user.Id, user.LoginFailure);

                if (user.LoginFailure >= securitySettings.MaxFailedAttempts)
                {
                    user.LockedTime = DateTime.UtcNow.AddMinutes(securitySettings.LockoutDurationMinutes);
                    user.Status = Status.Locked;
                    _logger.LogWarning("User {UserId} locked due to too many failed attempts", user.Id);
                    await _unitOfWork.SaveChangesAsync(cancellationToken);
                    return Result<AdminTokenResponse>.Failure($"登入失敗次數過多，帳戶已被鎖定 {securitySettings.LockoutDurationMinutes} 分鐘");
                }

                await _unitOfWork.SaveChangesAsync(cancellationToken);
                var remainingAttempts = securitySettings.MaxFailedAttempts - user.LoginFailure;
                return Result<AdminTokenResponse>.Failure($"信箱或密碼錯誤，剩餘 {remainingAttempts} 次嘗試機會");
            }

            await _actionLogService.LogLoginAsync(
                userId: user.Id.ToString(),
                userName: user.Name ?? request.Email,
                userType: "後台系統",
                isSuccess: false,
                loginMethod: "密碼",
                ipAddress: ipAddress,
                userAgent: userAgent,
                errorMessage: "密碼錯誤"
            );
            return Result<AdminTokenResponse>.Failure("信箱或密碼錯誤");
        }

        // 登入成功，重置失敗計數
        user.LoginFailure = 0;
        user.LockedTime = null;

        // 載入使用者角色
        var userWithRoles = await _unitOfWork.Users.GetByIdWithRolesAsync(user.Id, cancellationToken);
        if (userWithRoles == null)
        {
            _logger.LogError("User not found after password verification: {UserId}", user.Id);
            return Result<AdminTokenResponse>.Failure("系統錯誤");
        }

        // 更新最後登入時間
        userWithRoles.LoginTime = DateTime.UtcNow;
        userWithRoles.LastVisitedTime = DateTime.UtcNow;

        // 生成 Token
        var tokenResponse = _tokenService.GenerateAdminToken(userWithRoles);

        // 保存 RefreshToken 到數據庫
        userWithRoles.Token = tokenResponse.RefreshToken;

        // 檢查是否需要修改密碼
        if (!userWithRoles.FirstChanged)
        {
            tokenResponse.RequirePasswordChange = true;
            tokenResponse.PasswordChangeReason = securitySettings.RequirePasswordChangeOnFirstLogin
                ? "首次登入，請修改密碼"
                : "管理員要求您修改密碼";
            _logger.LogInformation("User {UserId} requires password change (FirstChanged=false)", userWithRoles.Id);
        }
        else if (securitySettings.EnablePasswordExpiry && userWithRoles.PasswordChangedTime.HasValue)
        {
            var passwordAge = DateTime.UtcNow - userWithRoles.PasswordChangedTime.Value;
            if (passwordAge.TotalDays > securitySettings.PasswordExpiryDays)
            {
                tokenResponse.RequirePasswordChange = true;
                tokenResponse.PasswordChangeReason = "密碼已過期，請修改密碼";
                _logger.LogInformation("User {UserId} password expired", userWithRoles.Id);
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 記錄登入成功
        await _actionLogService.LogLoginAsync(
            userId: userWithRoles.Id.ToString(),
            userName: userWithRoles.Name ?? userWithRoles.Account,
            userType: "後台系統",
            isSuccess: true,
            loginMethod: "密碼",
            ipAddress: ipAddress,
            userAgent: userAgent
        );

        _logger.LogInformation("Admin login successful for user {UserId}", userWithRoles.Id);

        return Result<AdminTokenResponse>.Success(tokenResponse);
    }

    /// <summary>
    /// 刷新令牌
    /// </summary>
    public async Task<Result<AdminTokenResponse>> RefreshTokenAsync(
        string refreshToken,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Admin refresh token attempt");

        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return Result<AdminTokenResponse>.Failure("刷新令牌不能為空");
        }

        // 驗證 Token 並獲取使用者ID
        var userId = _tokenService.GetUserIdFromToken(refreshToken);
        if (userId == null)
        {
            _logger.LogWarning("Refresh token invalid");
            return Result<AdminTokenResponse>.Failure("無效的刷新令牌");
        }

        // 查找使用者
        var user = await _unitOfWork.Users.GetByIdWithRolesAsync(userId.Value, cancellationToken);

        if (user == null || user.Token != refreshToken)
        {
            _logger.LogWarning("Refresh token not found or mismatched for user {UserId}", userId);
            return Result<AdminTokenResponse>.Failure("無效的刷新令牌");
        }

        // 檢查使用者狀態
        if (user.Status != Status.Active)
        {
            _logger.LogWarning("User {UserId} status is {Status}", user.Id, user.Status);
            return Result<AdminTokenResponse>.Failure($"賬戶狀態異常: {user.Status}");
        }

        // 生成新的 Token
        var tokenResponse = _tokenService.GenerateAdminToken(user);

        // 更新 RefreshToken
        user.Token = tokenResponse.RefreshToken;
        user.LastVisitedTime = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Admin refresh token successful for user {UserId}", user.Id);

        return Result<AdminTokenResponse>.Success(tokenResponse);
    }

    /// <summary>
    /// 修改密碼
    /// </summary>
    public async Task<Result> ChangePasswordAsync(
        Guid userId,
        ChangePasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Password change attempt for user {UserId}", userId);

        // 查找使用者
        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
        if (user == null)
        {
            _logger.LogWarning("Password change failed: User {UserId} not found", userId);
            return Result.Failure("使用者不存在");
        }

        // 驗證目前密碼
        if (!_passwordHasher.Verify(request.CurrentPassword, user.Password))
        {
            _logger.LogWarning("Password change failed: Invalid current password for user {UserId}", userId);
            return Result.Failure("目前密碼錯誤");
        }

        // 驗證密碼策略
        var policyResult = await _passwordPolicyService.ValidatePasswordAsync(request.NewPassword, cancellationToken);
        if (!policyResult.IsSuccess)
        {
            return Result.Failure(policyResult.Error!);
        }

        // 檢查新密碼是否與目前密碼相同
        if (_passwordHasher.Verify(request.NewPassword, user.Password))
        {
            return Result.Failure("新密碼不能與目前密碼相同");
        }

        // 更新密碼
        user.Password = _passwordHasher.Hash(request.NewPassword);
        user.PasswordChanged = true;
        user.FirstChanged = true;
        user.PasswordChangedTime = DateTime.UtcNow;
        user.UpdatedTime = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 記錄密碼變更
        await _actionLogService.LogAsync(new ActionLogEntry
        {
            ActionType = "PasswordChange",
            ActionName = "變更密碼",
            UserId = userId.ToString(),
            UserName = user.Name ?? user.Account,
            UserType = "後台系統",
            IsSuccess = true,
            Description = $"{user.Name ?? user.Account} 變更密碼成功"
        });

        _logger.LogInformation("Password changed successfully for user {UserId}", userId);

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

        // 查找使用者
        var user = await _unitOfWork.Users.GetByEmailAsync(request.Email, cancellationToken);

        // 無論使用者是否存在，都返回成功（防止帳號枚舉攻擊）
        if (user == null)
        {
            _logger.LogWarning("Forgot password: User not found for email {Email}", request.Email);
            // 不要透露使用者不存在
            return Result.Success();
        }

        // 檢查使用者狀態
        if (user.Status != Status.Active)
        {
            _logger.LogWarning("Forgot password: User {UserId} status is {Status}", user.Id, user.Status);
            // 不要透露帳號狀態
            return Result.Success();
        }

        // 生成重置密碼 Token
        var resetToken = _tokenService.GeneratePasswordResetToken(user.Id, user.Email ?? request.Email);

        // 構建重置密碼連結
        var adminBaseUrl = _configuration["App:AdminBaseUrl"] ?? "http://localhost:5173";
        var resetLink = $"{adminBaseUrl}/reset-password?token={Uri.EscapeDataString(resetToken)}";

        // 發送重置密碼郵件
        try
        {
            await _emailService.SendPasswordResetEmailAsync(user.Email ?? request.Email, resetLink, user.Name ?? user.Account, 30);
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
        AdminResetPasswordRequest request,
        string? ipAddress = null,
        string? userAgent = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Reset password attempt");

        // 驗證 Token
        var userId = _tokenService.ValidatePasswordResetToken(request.Token);
        if (userId == null)
        {
            _logger.LogWarning("Reset password failed: Invalid or expired token");
            return Result.Failure("重置連結無效或已過期，請重新申請");
        }

        // 查找使用者
        var user = await _unitOfWork.Users.GetByIdAsync(userId.Value, cancellationToken);
        if (user == null)
        {
            _logger.LogWarning("Reset password failed: User {UserId} not found", userId);
            return Result.Failure("使用者不存在");
        }

        // 檢查使用者狀態
        if (user.Status != Status.Active)
        {
            _logger.LogWarning("Reset password failed: User {UserId} status is {Status}", user.Id, user.Status);
            return Result.Failure("帳戶狀態異常，無法重置密碼");
        }

        // 驗證密碼策略
        var policyResult = await _passwordPolicyService.ValidatePasswordAsync(request.NewPassword, cancellationToken);
        if (!policyResult.IsSuccess)
        {
            return Result.Failure(policyResult.Error!);
        }

        // 檢查新密碼是否與目前密碼相同
        if (_passwordHasher.Verify(request.NewPassword, user.Password))
        {
            return Result.Failure("新密碼不能與目前密碼相同");
        }

        // 更新密碼
        user.Password = _passwordHasher.Hash(request.NewPassword);
        user.PasswordChanged = true;
        user.FirstChanged = true;
        user.PasswordChangedTime = DateTime.UtcNow;
        user.UpdatedTime = DateTime.UtcNow;

        // 清除鎖定狀態（如果有）
        user.LockedTime = null;
        user.LoginFailure = 0;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 記錄密碼重設
        await _actionLogService.LogAsync(new ActionLogEntry
        {
            ActionType = "PasswordReset",
            ActionName = "重設密碼",
            UserId = user.Id.ToString(),
            UserName = user.Name ?? user.Account,
            UserType = "後台系統",
            IpAddress = ipAddress,
            UserAgent = userAgent,
            IsSuccess = true,
            Description = $"{user.Name ?? user.Account} 透過郵件重設密碼成功"
        });

        _logger.LogInformation("Password reset successfully for user {UserId}", user.Id);

        return Result.Success();
    }

    /// <summary>
    /// 驗證重置密碼 Token 是否有效
    /// </summary>
    public async Task<Result<string>> ValidateResetTokenAsync(
        string token,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Validating reset token");

        // 驗證 Token
        var userId = _tokenService.ValidatePasswordResetToken(token);
        if (userId == null)
        {
            _logger.LogWarning("Token validation failed: Invalid or expired token");
            return Result<string>.Failure("重置連結無效或已過期");
        }

        // 查找使用者
        var user = await _unitOfWork.Users.GetByIdAsync(userId.Value, cancellationToken);
        if (user == null)
        {
            _logger.LogWarning("Token validation failed: User {UserId} not found", userId);
            return Result<string>.Failure("使用者不存在");
        }

        // 返回使用者郵箱（用於前端顯示）
        return Result<string>.Success(user.Email ?? string.Empty);
    }

    /// <summary>
    /// 獲取使用者資訊（包含頭像）
    /// </summary>
    public async Task<Result<AdminUserInfo>> GetProfileAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdWithRolesAsync(userId, cancellationToken);
        if (user == null)
        {
            return Result<AdminUserInfo>.Failure("使用者不存在");
        }

        var userInfo = MapToAdminUserInfo(user);
        return Result<AdminUserInfo>.Success(userInfo);
    }

    /// <summary>
    /// 更新頭像
    /// </summary>
    public async Task<Result<AdminUserInfo>> UpdateAvatarAsync(
        Guid userId,
        Guid? fileId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating avatar for user {UserId}, FileId: {FileId}", userId, fileId);

        var user = await _unitOfWork.Users.GetByIdWithRolesAsync(userId, cancellationToken);
        if (user == null)
        {
            return Result<AdminUserInfo>.Failure("使用者不存在");
        }

        user.AvatarFileId = fileId;
        user.UpdatedTime = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 重新載入使用者以獲取導覽屬性
        user = await _unitOfWork.Users.GetByIdWithRolesAsync(userId, cancellationToken);

        var userInfo = MapToAdminUserInfo(user!);

        _logger.LogInformation("Avatar updated successfully for user {UserId}", userId);

        return Result<AdminUserInfo>.Success(userInfo);
    }

    /// <summary>
    /// 更新個人資料
    /// </summary>
    public async Task<Result<AdminUserInfo>> UpdateProfileAsync(
        Guid userId,
        UpdateProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating profile for user {UserId}", userId);

        var user = await _unitOfWork.Users.GetByIdWithRolesAsync(userId, cancellationToken);
        if (user == null)
        {
            return Result<AdminUserInfo>.Failure("使用者不存在");
        }

        // 更新名稱（如果提供）
        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            user.Name = request.Name;
        }

        // 更新郵箱（如果提供）
        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            // 檢查郵箱是否已被其他使用者使用
            var existingUser = await _unitOfWork.Users.GetByEmailAsync(request.Email, cancellationToken);
            if (existingUser != null && existingUser.Id != userId)
            {
                return Result<AdminUserInfo>.Failure("該郵箱已被其他使用者使用");
            }
            user.Email = request.Email;
        }

        user.UpdatedTime = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 重新載入使用者以獲取導覽屬性
        user = await _unitOfWork.Users.GetByIdWithRolesAsync(userId, cancellationToken);

        var userInfo = MapToAdminUserInfo(user!);

        _logger.LogInformation("Profile updated successfully for user {UserId}", userId);

        return Result<AdminUserInfo>.Success(userInfo);
    }

    /// <summary>
    /// 將 User 實體映射到 AdminUserInfo DTO
    /// </summary>
    private AdminUserInfo MapToAdminUserInfo(User user)
    {
        // 計算合併權限
        var combinedPermissions = UserPermission.None;
        var roles = new List<RoleInfo>();

        foreach (var userRole in user.UserRoles)
        {
            if (userRole.Role != null)
            {
                combinedPermissions |= userRole.Role.Permissions;
                roles.Add(new RoleInfo
                {
                    Id = userRole.Role.Id,
                    Name = userRole.Role.Name,
                    Description = userRole.Role.Description,
                    Permissions = userRole.Role.Permissions
                });
            }
        }

        // 構建頭像 URL
        string? avatarUrl = null;
        if (user.AvatarFileId.HasValue)
        {
            avatarUrl = $"/api/FileManagement/{user.AvatarFileId}/download";
        }

        return new AdminUserInfo
        {
            Id = user.Id,
            Name = user.Name,
            Account = user.Account,
            Email = user.Email,
            AvatarFileId = user.AvatarFileId,
            AvatarUrl = avatarUrl,
            Roles = roles,
            Permissions = combinedPermissions
        };
    }
}