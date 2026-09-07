using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Auth;
using SPS.Application.DTOs.Company;
using SPS.Application.DTOs.Member;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Enums;

namespace SPS.Application.Services;

/// <summary>
/// 前台會員資料服務實現
/// </summary>
public class MemberProfileService : IMemberProfileService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IVerificationCodeService _verificationCodeService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ILogger<MemberProfileService> _logger;

    public MemberProfileService(
        IUnitOfWork unitOfWork,
        IVerificationCodeService verificationCodeService,
        IPasswordHasher passwordHasher,
        ILogger<MemberProfileService> logger)
    {
        _unitOfWork = unitOfWork;
        _verificationCodeService = verificationCodeService;
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    /// <summary>
    /// 取得會員個人資料
    /// </summary>
    public async Task<Result<MemberProfileResponse>> GetProfileAsync(
        Guid memberId,
        CancellationToken cancellationToken = default)
    {
        var member = await _unitOfWork.Members.GetByIdWithCompanyAsync(memberId, cancellationToken);
        if (member == null)
        {
            return Result<MemberProfileResponse>.Failure("會員不存在");
        }

        return Result<MemberProfileResponse>.Success(new MemberProfileResponse
        {
            Id = member.Id,
            Number = member.Number,
            Nickname = member.Nickname,
            Email = member.Email,
            Phone = member.Phone,
            Extension = member.Extension,
            MobilePhone = member.MobilePhone,
            CompanyId = member.CompanyId,
            CompanyName = member.Company?.Name,
            Position = member.Position,
            MemberJobTitle = member.MemberJobTitle,
            Role = member.Role,
            MemberPosition = member.MemberPosition,
            Permissions = member.Permissions,
            PhotoId = member.PhotoId,
            PhotoUrl = member.Photo?.Uri,
            IsEmailVerified = member.IsEmailVerified,
            EmailVerifiedAt = member.EmailVerifiedAt,
            LastLoginAt = member.LoginTime,
            CreatedAt = member.CreatedTime,
            UpdatedAt = member.UpdatedTime
        });
    }

    /// <summary>
    /// 更新會員個人資料
    /// </summary>
    public async Task<Result<MemberProfileResponse>> UpdateProfileAsync(
        Guid memberId,
        UpdateMemberProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        var member = await _unitOfWork.Members.GetByIdWithCompanyAsync(memberId, cancellationToken);
        if (member == null)
        {
            return Result<MemberProfileResponse>.Failure("會員不存在");
        }

        // 更新欄位
        if (request.Nickname != null) member.Nickname = request.Nickname;
        if (request.Phone != null) member.Phone = request.Phone;
        if (request.Extension != null) member.Extension = request.Extension;
        if (request.MobilePhone != null) member.MobilePhone = request.MobilePhone;
        if (request.Position != null) member.Position = request.Position;
        if (request.MemberJobTitle != null) member.MemberJobTitle = request.MemberJobTitle;
        if (request.PhotoId.HasValue) member.PhotoId = request.PhotoId;

        member.UpdatedTime = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Profile updated for member {MemberId}", memberId);

        return await GetProfileAsync(memberId, cancellationToken);
    }

    /// <summary>
    /// 發送驗證碼
    /// </summary>
    public async Task<Result> SendVerificationCodeAsync(
        Guid memberId,
        VerificationCodePurpose purpose,
        CancellationToken cancellationToken = default)
    {
        var member = await _unitOfWork.Members.GetByIdAsync(memberId, cancellationToken);
        if (member == null)
        {
            return Result.Failure("會員不存在");
        }

        return await _verificationCodeService.SendCodeAsync(
            member.Email,
            member.Nickname ?? member.Email,
            purpose,
            cancellationToken);
    }

    /// <summary>
    /// 修改密碼（需驗證碼）
    /// </summary>
    public async Task<Result> ChangePasswordAsync(
        Guid memberId,
        MemberChangePasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        var member = await _unitOfWork.Members.GetByIdAsync(memberId, cancellationToken);
        if (member == null)
        {
            return Result.Failure("會員不存在");
        }

        // 確認郵箱匹配
        if (!member.Email.Equals(request.Email, StringComparison.OrdinalIgnoreCase))
        {
            return Result.Failure("郵箱不匹配");
        }

        // 驗證驗證碼
        var verifyResult = await _verificationCodeService.VerifyCodeAsync(
            request.Email,
            request.VerificationCode,
            VerificationCodePurpose.ChangePassword,
            cancellationToken);

        if (!verifyResult.IsSuccess)
        {
            return Result.Failure(verifyResult.Error ?? "驗證碼驗證失敗");
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
            VerificationCodePurpose.ChangePassword,
            cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Password changed for member {MemberId}", memberId);

        return Result.Success();
    }

    /// <summary>
    /// 驗證信箱（需驗證碼）
    /// </summary>
    public async Task<Result> VerifyEmailAsync(
        Guid memberId,
        string verificationCode,
        CancellationToken cancellationToken = default)
    {
        var member = await _unitOfWork.Members.GetByIdAsync(memberId, cancellationToken);
        if (member == null)
        {
            return Result.Failure("會員不存在");
        }

        // 檢查是否已驗證
        if (member.IsEmailVerified)
        {
            return Result.Failure("信箱已經驗證過了");
        }

        // 驗證驗證碼
        var verifyResult = await _verificationCodeService.VerifyCodeAsync(
            member.Email,
            verificationCode,
            VerificationCodePurpose.VerifyEmail,
            cancellationToken);

        if (!verifyResult.IsSuccess)
        {
            return Result.Failure(verifyResult.Error ?? "驗證碼驗證失敗");
        }

        // 更新驗證狀態
        member.IsEmailVerified = true;
        member.EmailVerifiedAt = DateTime.UtcNow;
        member.UpdatedTime = DateTime.UtcNow;

        // 使驗證碼失效
        await _verificationCodeService.InvalidateCodeAsync(
            member.Email,
            VerificationCodePurpose.VerifyEmail,
            cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Email verified for member {MemberId}", memberId);

        return Result.Success();
    }

    /// <summary>
    /// 取得公司資料
    /// </summary>
    public async Task<Result<CompanyResponse>> GetCompanyAsync(
        Guid memberId,
        CancellationToken cancellationToken = default)
    {
        var member = await _unitOfWork.Members.GetByIdWithCompanyAsync(memberId, cancellationToken);
        if (member == null)
        {
            return Result<CompanyResponse>.Failure("會員不存在");
        }

        if (!member.CompanyId.HasValue)
        {
            return Result<CompanyResponse>.Failure("會員沒有關聯公司");
        }

        var company = await _unitOfWork.Companies.GetByIdAsync(member.CompanyId.Value, cancellationToken);
        if (company == null)
        {
            return Result<CompanyResponse>.Failure("公司不存在");
        }

        return Result<CompanyResponse>.Success(MapToCompanyResponse(company));
    }

    /// <summary>
    /// 更新公司資料
    /// </summary>
    public async Task<Result<CompanyResponse>> UpdateCompanyAsync(
        Guid memberId,
        UpdateCompanyRequest request,
        CancellationToken cancellationToken = default)
    {
        var member = await _unitOfWork.Members.GetByIdAsync(memberId, cancellationToken);
        if (member == null)
        {
            return Result<CompanyResponse>.Failure("會員不存在");
        }

        if (!member.CompanyId.HasValue)
        {
            return Result<CompanyResponse>.Failure("會員沒有關聯公司");
        }

        var company = await _unitOfWork.Companies.GetByIdAsync(member.CompanyId.Value, cancellationToken);
        if (company == null)
        {
            return Result<CompanyResponse>.Failure("公司不存在");
        }

        // 更新公司資料
        if (request.Name != null) company.Name = request.Name;
        if (request.EnglishName != null) company.EnglishName = request.EnglishName;
        if (request.Phone != null) company.Phone = request.Phone;
        if (request.Fax != null) company.Fax = request.Fax;
        if (request.Type.HasValue) company.Type = request.Type.Value;
        if (request.Revenue.HasValue) company.Revenue = request.Revenue;
        if (request.Employees.HasValue) company.Employees = request.Employees;
        if (request.Subject != null) company.Subject = request.Subject;
        if (request.Introduction != null) company.Introduction = request.Introduction;
        if (request.IntroductionEnglish != null) company.IntroductionEnglish = request.IntroductionEnglish;
        if (request.OrgUrl != null) company.OrgUrl = request.OrgUrl;
        if (request.VideoUrl != null) company.VideoUrl = request.VideoUrl;
        if (request.Charge != null) company.Charge = request.Charge;
        if (request.ChargeEmail != null) company.ChargeEmail = request.ChargeEmail;
        if (request.ChargePhone != null) company.ChargePhone = request.ChargePhone;
        if (request.ChargeMobile != null) company.ChargeMobile = request.ChargeMobile;
        if (request.ChargeJobTitle != null) company.ChargeJobTitle = request.ChargeJobTitle;
        if (request.EstablishmentDate != null) company.EstablishmentDate = request.EstablishmentDate;
        if (request.Remark != null) company.Remark = request.Remark;
        if (request.PhotoId.HasValue) company.PhotoId = request.PhotoId;
        if (request.BannerId.HasValue) company.BannerId = request.BannerId;

        // 更新地址
        if (request.Address != null)
        {
            if (company.Address == null)
            {
                company.Address = new Domain.Entities.Address
                {
                    Type = request.Address.Type,
                    PostalCode = request.Address.PostalCode,
                    Region = request.Address.Region,
                    City = request.Address.City,
                    District = request.Address.District,
                    Line = request.Address.Line,
                    Description = request.Address.Description
                };
            }
            else
            {
                company.Address.Type = request.Address.Type;
                company.Address.PostalCode = request.Address.PostalCode;
                company.Address.Region = request.Address.Region;
                company.Address.City = request.Address.City;
                company.Address.District = request.Address.District;
                company.Address.Line = request.Address.Line;
                company.Address.Description = request.Address.Description;
            }
        }

        company.UpdatedTime = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Company {CompanyId} updated by member {MemberId}", company.Id, memberId);

        return Result<CompanyResponse>.Success(MapToCompanyResponse(company));
    }

    /// <summary>
    /// 取得公司成員列表
    /// </summary>
    public async Task<Result<List<MemberListItemResponse>>> GetCompanyMembersAsync(
        Guid memberId,
        CancellationToken cancellationToken = default)
    {
        var member = await _unitOfWork.Members.GetByIdAsync(memberId, cancellationToken);
        if (member == null)
        {
            return Result<List<MemberListItemResponse>>.Failure("會員不存在");
        }

        if (!member.CompanyId.HasValue)
        {
            return Result<List<MemberListItemResponse>>.Failure("會員沒有關聯公司");
        }

        var members = await _unitOfWork.Members.GetByCompanyIdAsync(member.CompanyId.Value, cancellationToken);

        var response = members.Select(m => MapToMemberListItem(m)).ToList();

        return Result<List<MemberListItemResponse>>.Success(response);
    }

    /// <summary>
    /// 強制重置成員密碼
    /// </summary>
    public async Task<Result> ResetMemberPasswordAsync(
        Guid managerId,
        Guid targetMemberId,
        ResetMemberPasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        var manager = await _unitOfWork.Members.GetByIdAsync(managerId, cancellationToken);
        if (manager == null)
        {
            return Result.Failure("管理員不存在");
        }

        // 確認是 Manager
        if (manager.MemberPosition != MemberPosition.Manager)
        {
            return Result.Failure("只有 Manager 可以重置成員密碼");
        }

        var targetMember = await _unitOfWork.Members.GetByIdAsync(targetMemberId, cancellationToken);
        if (targetMember == null)
        {
            return Result.Failure("目標會員不存在");
        }

        // 確認是同一公司
        if (manager.CompanyId != targetMember.CompanyId)
        {
            return Result.Failure("只能重置同公司成員的密碼");
        }

        // 不能重置自己的密碼
        if (managerId == targetMemberId)
        {
            return Result.Failure("不能使用此功能重置自己的密碼");
        }

        // 重置密碼
        targetMember.Password = _passwordHasher.Hash(request.NewPassword);
        targetMember.FirstChanged = !request.RequirePasswordChange;
        targetMember.PasswordChanged = false;
        targetMember.PasswordChangedTime = DateTime.UtcNow;
        targetMember.UpdatedTime = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Password reset for member {TargetMemberId} by manager {ManagerId}",
            targetMemberId, managerId);

        return Result.Success();
    }

    /// <summary>
    /// 新增公司成員
    /// </summary>
    public async Task<Result<MemberListItemResponse>> CreateCompanyMemberAsync(
        Guid managerId,
        CreateCompanyMemberRequest request,
        CancellationToken cancellationToken = default)
    {
        var manager = await _unitOfWork.Members.GetByIdWithCompanyAsync(managerId, cancellationToken);
        if (manager == null)
            return Result<MemberListItemResponse>.Failure("管理員不存在");

        if (manager.MemberPosition != MemberPosition.Manager)
            return Result<MemberListItemResponse>.Failure("只有 Manager 可以新增公司成員");

        if (!manager.CompanyId.HasValue)
            return Result<MemberListItemResponse>.Failure("管理員沒有關聯公司");

        // 檢查 Email 是否已存在
        var emailExists = await _unitOfWork.Members.ExistsByEmailAsync(request.Email, cancellationToken);
        if (emailExists)
            return Result<MemberListItemResponse>.Failure("該 Email 已被使用");

        var member = new Domain.Entities.Member
        {
            Id = Guid.NewGuid(),
            Number = $"M{DateTime.UtcNow:yyyyMMddHHmmssfff}{Guid.NewGuid().ToString("N")[..4]}",
            Email = request.Email,
            Nickname = request.Nickname,
            Phone = request.Phone ?? string.Empty,
            Extension = request.Extension,
            MobilePhone = request.MobilePhone,
            Password = _passwordHasher.Hash(request.Password),
            Position = request.Position,
            MemberJobTitle = request.MemberJobTitle,
            MemberPosition = request.MemberPosition,
            CompanyId = manager.CompanyId,
            Role = manager.Role,
            Status = Status.Active,
            DataMode = DataMode.Normal,
            IsApproved = true,
            IsDesignatedContact = request.IsDesignatedContact,
            Permissions = MemberPermission.ViewCompany,
            CreatedTime = DateTime.UtcNow,
            UpdatedTime = DateTime.UtcNow
        };

        await _unitOfWork.Members.AddAsync(member, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Company member created {MemberId} by manager {ManagerId}", member.Id, managerId);

        var response = MapToMemberListItem(member);
        response.CompanyName = manager.Company?.Name;
        return Result<MemberListItemResponse>.Success(response);
    }

    /// <summary>
    /// 更新公司成員
    /// </summary>
    public async Task<Result<MemberListItemResponse>> UpdateCompanyMemberAsync(
        Guid managerId,
        Guid targetMemberId,
        UpdateCompanyMemberRequest request,
        CancellationToken cancellationToken = default)
    {
        var manager = await _unitOfWork.Members.GetByIdAsync(managerId, cancellationToken);
        if (manager == null)
            return Result<MemberListItemResponse>.Failure("管理員不存在");

        if (manager.MemberPosition != MemberPosition.Manager)
            return Result<MemberListItemResponse>.Failure("只有 Manager 可以更新公司成員");

        var target = await _unitOfWork.Members.GetByIdWithCompanyAsync(targetMemberId, cancellationToken);
        if (target == null)
            return Result<MemberListItemResponse>.Failure("目標會員不存在");

        if (manager.CompanyId != target.CompanyId)
            return Result<MemberListItemResponse>.Failure("只能更新同公司成員");

        if (request.Nickname != null) target.Nickname = request.Nickname;
        if (request.Phone != null) target.Phone = request.Phone;
        if (request.Extension != null) target.Extension = request.Extension;
        if (request.MobilePhone != null) target.MobilePhone = request.MobilePhone;
        if (request.Position != null) target.Position = request.Position;
        if (request.MemberJobTitle != null) target.MemberJobTitle = request.MemberJobTitle;
        if (request.Status.HasValue) target.Status = request.Status.Value;
        if (request.IsDesignatedContact.HasValue) target.IsDesignatedContact = request.IsDesignatedContact.Value;

        target.UpdatedTime = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Company member {TargetMemberId} updated by manager {ManagerId}", targetMemberId, managerId);

        return Result<MemberListItemResponse>.Success(MapToMemberListItem(target));
    }

    /// <summary>
    /// 刪除公司成員
    /// </summary>
    public async Task<Result<bool>> DeleteCompanyMemberAsync(
        Guid managerId,
        Guid targetMemberId,
        CancellationToken cancellationToken = default)
    {
        var manager = await _unitOfWork.Members.GetByIdAsync(managerId, cancellationToken);
        if (manager == null)
            return Result<bool>.Failure("管理員不存在");

        if (manager.MemberPosition != MemberPosition.Manager)
            return Result<bool>.Failure("只有 Manager 可以刪除公司成員");

        if (managerId == targetMemberId)
            return Result<bool>.Failure("不能刪除自己");

        var target = await _unitOfWork.Members.GetByIdAsync(targetMemberId, cancellationToken);
        if (target == null)
            return Result<bool>.Failure("目標會員不存在");

        if (manager.CompanyId != target.CompanyId)
            return Result<bool>.Failure("只能刪除同公司成員");

        await _unitOfWork.Members.DeleteAsync(target, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Company member {TargetMemberId} deleted by manager {ManagerId}", targetMemberId, managerId);

        return Result<bool>.Success(true);
    }

    /// <summary>
    /// 切換指定聯絡人狀態
    /// </summary>
    public async Task<Result<MemberListItemResponse>> ToggleDesignatedContactAsync(
        Guid managerId,
        Guid targetMemberId,
        bool isDesignatedContact,
        CancellationToken cancellationToken = default)
    {
        var manager = await _unitOfWork.Members.GetByIdAsync(managerId, cancellationToken);
        if (manager == null)
            return Result<MemberListItemResponse>.Failure("管理員不存在");

        if (manager.MemberPosition != MemberPosition.Manager)
            return Result<MemberListItemResponse>.Failure("只有 Manager 可以指定聯絡人");

        var target = await _unitOfWork.Members.GetByIdWithCompanyAsync(targetMemberId, cancellationToken);
        if (target == null)
            return Result<MemberListItemResponse>.Failure("目標會員不存在");

        if (manager.CompanyId != target.CompanyId)
            return Result<MemberListItemResponse>.Failure("只能操作同公司成員");

        target.IsDesignatedContact = isDesignatedContact;
        target.UpdatedTime = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Member {TargetMemberId} designated contact set to {IsDesignatedContact} by manager {ManagerId}",
            targetMemberId, isDesignatedContact, managerId);

        return Result<MemberListItemResponse>.Success(MapToMemberListItem(target));
    }

    private static MemberListItemResponse MapToMemberListItem(Domain.Entities.Member m)
    {
        return new MemberListItemResponse
        {
            Id = m.Id,
            Name = m.Nickname ?? m.Email,
            Email = m.Email,
            Phone = m.Phone,
            Extension = m.Extension,
            MobilePhone = m.MobilePhone,
            Position = m.Position,
            MemberJobTitle = m.MemberJobTitle,
            CompanyId = m.CompanyId,
            CompanyName = m.Company?.Name,
            Status = m.Status,
            Role = m.Role,
            MemberPosition = m.MemberPosition,
            IsApproved = m.IsApproved,
            IsEmailVerified = m.IsEmailVerified,
            IsDesignatedContact = m.IsDesignatedContact,
            LastLoginAt = m.LoginTime,
            CreatedAt = m.CreatedTime
        };
    }

    private static CompanyResponse MapToCompanyResponse(Domain.Entities.Company company)
    {
        return new CompanyResponse
        {
            Id = company.Id,
            Number = company.Number,
            Name = company.Name,
            EnglishName = company.EnglishName,
            UnifiedSocialCreditCode = company.UnifiedSocialCreditCode,
            Phone = company.Phone,
            Fax = company.Fax,
            Type = company.Type,
            Level = company.Level,
            Revenue = company.Revenue,
            Employees = company.Employees,
            Subject = company.Subject,
            Introduction = company.Introduction,
            IntroductionEnglish = company.IntroductionEnglish,
            OrgUrl = company.OrgUrl,
            VideoUrl = company.VideoUrl,
            Charge = company.Charge,
            ChargeEmail = company.ChargeEmail,
            ChargePhone = company.ChargePhone,
            ChargeMobile = company.ChargeMobile,
            ChargeJobTitle = company.ChargeJobTitle,
            EstablishmentDate = company.EstablishmentDate,
            Remark = company.Remark,
            Status = company.Status,
            IsVerified = company.IsVerified,
            VerifiedAt = company.VerifiedAt,
            Address = company.Address != null ? new DTOs.Common.AddressDto
            {
                Id = company.Address.Id,
                Type = company.Address.Type,
                PostalCode = company.Address.PostalCode,
                Region = company.Address.Region,
                City = company.Address.City,
                District = company.Address.District,
                Line = company.Address.Line,
                Description = company.Address.Description
            } : null,
            Photo = company.Photo != null ? new DTOs.Picture.PictureResponse
            {
                Id = company.Photo.Id,
                Name = company.Photo.Name,
                Uri = company.Photo.Uri,
                ThumbnailUri = company.Photo.ThumbnailUri
            } : null,
            Banner = company.Banner != null ? new DTOs.Picture.PictureResponse
            {
                Id = company.Banner.Id,
                Name = company.Banner.Name,
                Uri = company.Banner.Uri,
                ThumbnailUri = company.Banner.ThumbnailUri
            } : null,
            DesignatedContacts = company.Members?
                .Where(m => m.IsDesignatedContact)
                .Select(m => new DTOs.Company.DesignatedContactResponse
                {
                    Id = m.Id,
                    Name = m.Nickname ?? m.Email,
                    Email = m.Email,
                    Phone = !string.IsNullOrEmpty(m.Phone)
                        ? (!string.IsNullOrEmpty(m.Extension) ? $"{m.Phone}#{m.Extension}" : m.Phone)
                        : null,
                    MobilePhone = m.MobilePhone,
                    MemberJobTitle = m.MemberJobTitle
                }).ToList(),
            CreatedTime = company.CreatedTime,
            UpdatedTime = company.UpdatedTime
        };
    }
}
