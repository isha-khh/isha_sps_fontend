using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Member;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;

namespace SPS.Application.Services;

public class MemberService : IMemberService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<MemberService> _logger;
    private readonly IPasswordHasher _passwordHasher;

    public MemberService(IUnitOfWork unitOfWork, ILogger<MemberService> logger, IPasswordHasher passwordHasher)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
        _passwordHasher = passwordHasher;
    }

    public async Task<Result<PagedResult<MemberListItemResponse>>> GetPagedAsync(MemberQueryParameters parameters, CancellationToken cancellationToken = default)
    {
        var pagedResult = await _unitOfWork.Members.GetPagedAsync(parameters, cancellationToken);
        var response = new PagedResult<MemberListItemResponse>
        {
            Items = pagedResult.Items.Select(MapToListItem).ToList(),
            TotalCount = pagedResult.TotalCount,
            Page = pagedResult.Page,
            PageSize = pagedResult.PageSize
        };
        return Result<PagedResult<MemberListItemResponse>>.Success(response);
    }

    public async Task<Result<MemberResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var member = await _unitOfWork.Members.GetByIdAsync(id, cancellationToken);
        if (member == null) return Result<MemberResponse>.Failure("會員不存在");
        return Result<MemberResponse>.Success(MapToResponse(member));
    }

    public async Task<Result<MemberResponse>> UpdateAsync(Guid id, UpdateMemberRequest request, CancellationToken cancellationToken = default)
    {
        var member = await _unitOfWork.Members.GetByIdAsync(id, cancellationToken);
        if (member == null) return Result<MemberResponse>.Failure("會員不存在");

        // 基本資料
        if (request.Name != null) member.Nickname = request.Name;
        if (request.Phone != null) member.Phone = request.Phone;
        if (request.Extension != null) member.Extension = request.Extension;
        if (request.MobilePhone != null) member.MobilePhone = request.MobilePhone;
        if (request.Status.HasValue) member.Status = request.Status.Value;
        if (request.MemberPosition.HasValue) member.MemberPosition = request.MemberPosition.Value;
        if (request.Remark != null) member.Remark = request.Remark;
        if (request.MemberJobTitle != null) member.MemberJobTitle = request.MemberJobTitle;
        if (request.Position != null) member.Position = request.Position;

        // 密碼相關設定
        if (request.RequirePasswordChange.HasValue)
        {
            member.FirstChanged = !request.RequirePasswordChange.Value;
        }

        await _unitOfWork.Members.UpdateAsync(member, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<MemberResponse>.Success(MapToResponse(member));
    }

    public async Task<Result<MemberResponse>> ResetPasswordAsync(Guid id, AdminResetMemberPasswordRequest request, CancellationToken cancellationToken = default)
    {
        var member = await _unitOfWork.Members.GetByIdAsync(id, cancellationToken);
        if (member == null) return Result<MemberResponse>.Failure("會員不存在");

        // 生成或使用提供的密碼
        var newPassword = string.IsNullOrEmpty(request.NewPassword)
            ? GenerateRandomPassword()
            : request.NewPassword;

        // 使用密碼哈希服務加密密碼
        member.Password = _passwordHasher.Hash(newPassword);
        member.PasswordChanged = true;
        member.PasswordChangedTime = DateTime.UtcNow;

        // 設定是否需要下次登入修改密碼
        member.FirstChanged = !request.RequireChangeOnLogin;

        // 清除鎖定狀態
        member.LockedTime = null;
        member.LoginFailure = 0;
        if (member.Status == Status.Locked)
        {
            member.Status = Status.Active;
        }

        await _unitOfWork.Members.UpdateAsync(member, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Admin reset password for member {MemberId}", id);

        return Result<MemberResponse>.Success(MapToResponse(member));
    }

    public async Task<Result> UnlockMemberAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var member = await _unitOfWork.Members.GetByIdAsync(id, cancellationToken);
        if (member == null) return Result.Failure("會員不存在");

        member.LockedTime = null;
        member.LoginFailure = 0;
        if (member.Status == Status.Locked)
        {
            member.Status = Status.Active;
        }

        await _unitOfWork.Members.UpdateAsync(member, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Admin unlocked member {MemberId}", id);

        return Result.Success();
    }

    public async Task<Result<MemberResponse>> UpdateEmailVerificationAsync(Guid id, bool isVerified, CancellationToken cancellationToken = default)
    {
        var member = await _unitOfWork.Members.GetByIdAsync(id, cancellationToken);
        if (member == null) return Result<MemberResponse>.Failure("會員不存在");

        member.IsEmailVerified = isVerified;
        member.EmailVerifiedAt = isVerified ? DateTime.UtcNow : null;

        await _unitOfWork.Members.UpdateAsync(member, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Admin updated email verification status for member {MemberId} to {IsVerified}", id, isVerified);

        return Result<MemberResponse>.Success(MapToResponse(member));
    }

    private static string GenerateRandomPassword(int length = 12)
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, length).Select(s => s[random.Next(s.Length)]).ToArray());
    }

    public async Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var member = await _unitOfWork.Members.GetByIdAsync(id, cancellationToken);
        if (member == null) return Result.Failure("會員不存在");

        await _unitOfWork.Members.DeleteAsync(member, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }

    public async Task<Result<MemberStatisticsDto>> GetStatisticsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var query = _unitOfWork.Members.GetQueryable();

            var statistics = new MemberStatisticsDto
            {
                Total = await query.CountAsync(cancellationToken),
                Active = await query.CountAsync(m => m.Status == Status.Active, cancellationToken),
                Inactive = await query.CountAsync(m => m.Status == Status.Inactive, cancellationToken),
                Pending = await query.CountAsync(m => m.Status == Status.PendingApproval, cancellationToken),
                Approved = await query.CountAsync(m => m.Status == Status.Approved, cancellationToken),
                Rejected = await query.CountAsync(m => m.Status == Status.Rejected, cancellationToken),
                Suspended = await query.CountAsync(m => m.Status == Status.Suspended, cancellationToken),
                Locked = await query.CountAsync(m => m.Status == Status.Locked, cancellationToken),
                WithCompany = await query.CountAsync(m => m.CompanyId != null, cancellationToken),
                WithoutCompany = await query.CountAsync(m => m.CompanyId == null, cancellationToken)
            };

            return Result<MemberStatisticsDto>.Success(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting member statistics");
            return Result<MemberStatisticsDto>.Failure($"獲取會員統計失敗: {ex.Message}");
        }
    }

    public async Task<Result<MemberResponse>> ToggleDesignatedContactAsync(Guid id, bool isDesignatedContact, CancellationToken cancellationToken = default)
    {
        var member = await _unitOfWork.Members.GetByIdAsync(id, cancellationToken);
        if (member == null) return Result<MemberResponse>.Failure("會員不存在");

        member.IsDesignatedContact = isDesignatedContact;
        member.UpdatedTime = DateTime.UtcNow;

        await _unitOfWork.Members.UpdateAsync(member, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Admin toggled designated contact for member {MemberId} to {IsDesignatedContact}", id, isDesignatedContact);

        return Result<MemberResponse>.Success(MapToResponse(member));
    }

    public async Task<Result<BatchOperationResult>> BatchResetPasswordAsync(BatchResetPasswordRequest request, CancellationToken cancellationToken = default)
    {
        var members = await _unitOfWork.Members.GetQueryable()
            .Where(m => request.MemberIds.Contains(m.Id))
            .ToListAsync(cancellationToken);

        var result = new BatchOperationResult();

        foreach (var member in members)
        {
            var newPassword = GenerateRandomPassword();
            member.Password = _passwordHasher.Hash(newPassword);
            member.PasswordChanged = true;
            member.PasswordChangedTime = DateTime.UtcNow;
            member.FirstChanged = !request.RequireChangeOnLogin;

            // 清除鎖定狀態
            member.LockedTime = null;
            member.LoginFailure = 0;
            if (member.Status == Status.Locked)
            {
                member.Status = Status.Active;
            }

            await _unitOfWork.Members.UpdateAsync(member, cancellationToken);
            result.Success++;
        }

        result.Failed = request.MemberIds.Count - result.Success;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Admin batch reset password for {Count} members", result.Success);

        return Result<BatchOperationResult>.Success(result);
    }

    public async Task<Result<BatchOperationResult>> BatchUpdateEmailVerificationAsync(BatchUpdateEmailVerificationRequest request, CancellationToken cancellationToken = default)
    {
        var members = await _unitOfWork.Members.GetQueryable()
            .Where(m => request.MemberIds.Contains(m.Id))
            .ToListAsync(cancellationToken);

        var result = new BatchOperationResult();

        foreach (var member in members)
        {
            member.IsEmailVerified = request.IsVerified;
            member.EmailVerifiedAt = request.IsVerified ? DateTime.UtcNow : null;

            await _unitOfWork.Members.UpdateAsync(member, cancellationToken);
            result.Success++;
        }

        result.Failed = request.MemberIds.Count - result.Success;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Admin batch updated email verification for {Count} members to {IsVerified}", result.Success, request.IsVerified);

        return Result<BatchOperationResult>.Success(result);
    }

    public async Task<Result<BatchOperationResult>> BatchRequirePasswordChangeAsync(BatchRequirePasswordChangeRequest request, CancellationToken cancellationToken = default)
    {
        var members = await _unitOfWork.Members.GetQueryable()
            .Where(m => request.MemberIds.Contains(m.Id))
            .ToListAsync(cancellationToken);

        var result = new BatchOperationResult();

        foreach (var member in members)
        {
            // FirstChanged = false 表示需要修改密碼, true 表示已修改過不需要
            member.FirstChanged = !request.RequireChange;

            await _unitOfWork.Members.UpdateAsync(member, cancellationToken);
            result.Success++;
        }

        result.Failed = request.MemberIds.Count - result.Success;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Admin batch set require password change for {Count} members to {RequireChange}", result.Success, request.RequireChange);

        return Result<BatchOperationResult>.Success(result);
    }

    private MemberListItemResponse MapToListItem(Member member)
    {
        return new MemberListItemResponse
        {
            Id = member.Id,
            Name = member.Nickname ?? string.Empty,
            Email = member.Email,
            Phone = member.Phone,
            Extension = member.Extension,
            MobilePhone = member.MobilePhone,
            Position = member.Position,
            MemberJobTitle = member.MemberJobTitle,
            CompanyId = member.CompanyId,
            CompanyName = member.Company?.Name,
            Status = member.Status,
            Role = member.Role,
            MemberPosition = member.MemberPosition,
            IsApproved = member.IsApproved,
            IsEmailVerified = member.IsEmailVerified,
            IsDesignatedContact = member.IsDesignatedContact,
            LastLoginAt = member.LoginTime,
            CreatedAt = member.CreatedTime
        };
    }

    private MemberResponse MapToResponse(Member member)
    {
        return new MemberResponse
        {
            Id = member.Id,
            Number = member.Number,
            Name = member.Nickname ?? string.Empty,
            Email = member.Email,
            Phone = member.Phone,
            Extension = member.Extension,
            MobilePhone = member.MobilePhone,
            CompanyId = member.CompanyId,
            CompanyName = member.Company?.Name,
            Position = member.Position,
            MemberJobTitle = member.MemberJobTitle,
            Status = member.Status,
            Role = member.Role,
            MemberPosition = member.MemberPosition,
            IsApproved = member.IsApproved,
            IsEmailVerified = member.IsEmailVerified,
            IsDesignatedContact = member.IsDesignatedContact,
            EmailVerifiedAt = member.EmailVerifiedAt,
            Remark = member.Remark,
            LastLoginAt = member.LoginTime,
            CreatedAt = member.CreatedTime,
            UpdatedAt = member.UpdatedTime,
            // 密碼相關欄位
            FirstChanged = member.FirstChanged,
            PasswordChanged = member.PasswordChanged,
            PasswordChangedTime = member.PasswordChangedTime,
            LockedTime = member.LockedTime,
            LoginFailure = member.LoginFailure
        };
    }
}
