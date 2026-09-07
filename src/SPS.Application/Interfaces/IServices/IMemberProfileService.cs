using SPS.Application.Common;
using SPS.Application.DTOs.Auth;
using SPS.Application.DTOs.Company;
using SPS.Application.DTOs.Member;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 前台會員資料服務介面
/// </summary>
public interface IMemberProfileService
{
    /// <summary>
    /// 取得會員個人資料
    /// </summary>
    Task<Result<MemberProfileResponse>> GetProfileAsync(Guid memberId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新會員個人資料
    /// </summary>
    Task<Result<MemberProfileResponse>> UpdateProfileAsync(Guid memberId, UpdateMemberProfileRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// 發送驗證碼
    /// </summary>
    Task<Result> SendVerificationCodeAsync(Guid memberId, VerificationCodePurpose purpose, CancellationToken cancellationToken = default);

    /// <summary>
    /// 修改密碼（需驗證碼）
    /// </summary>
    Task<Result> ChangePasswordAsync(Guid memberId, MemberChangePasswordRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// 驗證信箱（需驗證碼）
    /// </summary>
    Task<Result> VerifyEmailAsync(Guid memberId, string verificationCode, CancellationToken cancellationToken = default);

    /// <summary>
    /// 取得公司資料（需 ViewCompany 權限）
    /// </summary>
    Task<Result<CompanyResponse>> GetCompanyAsync(Guid memberId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新公司資料（需 EditCompany 權限）
    /// </summary>
    Task<Result<CompanyResponse>> UpdateCompanyAsync(Guid memberId, UpdateCompanyRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// 取得公司成員列表（需 EditCompany 權限）
    /// </summary>
    Task<Result<List<MemberListItemResponse>>> GetCompanyMembersAsync(Guid memberId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 強制重置成員密碼（需 EditCompany 權限，僅 Manager 可用）
    /// </summary>
    Task<Result> ResetMemberPasswordAsync(Guid managerId, Guid targetMemberId, ResetMemberPasswordRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// 新增公司成員（僅 Manager 可用）
    /// </summary>
    Task<Result<MemberListItemResponse>> CreateCompanyMemberAsync(Guid managerId, CreateCompanyMemberRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新公司成員（僅 Manager 可用）
    /// </summary>
    Task<Result<MemberListItemResponse>> UpdateCompanyMemberAsync(Guid managerId, Guid targetMemberId, UpdateCompanyMemberRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除公司成員（僅 Manager 可用）
    /// </summary>
    Task<Result<bool>> DeleteCompanyMemberAsync(Guid managerId, Guid targetMemberId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 切換指定聯絡人狀態（僅 Manager 可用）
    /// </summary>
    Task<Result<MemberListItemResponse>> ToggleDesignatedContactAsync(Guid managerId, Guid targetMemberId, bool isDesignatedContact, CancellationToken cancellationToken = default);
}
