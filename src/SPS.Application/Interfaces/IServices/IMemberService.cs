using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Member;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 會員管理服務接口
/// </summary>
public interface IMemberService
{
    /// <summary>
    /// 分頁查詢會員列表
    /// </summary>
    Task<Result<PagedResult<MemberListItemResponse>>> GetPagedAsync(MemberQueryParameters parameters, CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取會員詳情
    /// </summary>
    Task<Result<MemberResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新會員資訊
    /// </summary>
    Task<Result<MemberResponse>> UpdateAsync(Guid id, UpdateMemberRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除會員
    /// </summary>
    Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取會員統計數據
    /// </summary>
    Task<Result<MemberStatisticsDto>> GetStatisticsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 管理員重置會員密碼
    /// </summary>
    Task<Result<MemberResponse>> ResetPasswordAsync(Guid id, AdminResetMemberPasswordRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// 解鎖會員帳戶
    /// </summary>
    Task<Result> UnlockMemberAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新會員信箱驗證狀態
    /// </summary>
    Task<Result<MemberResponse>> UpdateEmailVerificationAsync(Guid id, bool isVerified, CancellationToken cancellationToken = default);

    /// <summary>
    /// Admin 切換指定聯絡人狀態
    /// </summary>
    Task<Result<MemberResponse>> ToggleDesignatedContactAsync(Guid id, bool isDesignatedContact, CancellationToken cancellationToken = default);

    /// <summary>
    /// 批次重置會員密碼
    /// </summary>
    Task<Result<BatchOperationResult>> BatchResetPasswordAsync(BatchResetPasswordRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// 批次更新會員信箱驗證狀態
    /// </summary>
    Task<Result<BatchOperationResult>> BatchUpdateEmailVerificationAsync(BatchUpdateEmailVerificationRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// 批次設定要求下次登入修改密碼
    /// </summary>
    Task<Result<BatchOperationResult>> BatchRequirePasswordChangeAsync(BatchRequirePasswordChangeRequest request, CancellationToken cancellationToken = default);
}
