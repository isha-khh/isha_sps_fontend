using SPS.Application.Common;
using SPS.Application.DTOs.Application;
using SPS.Application.DTOs.Common;
using SPS.Domain.Enums;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 申請審核服務接口
/// </summary>
public interface IApplicationReviewService
{
    /// <summary>
    /// 獲取待審核申請列表
    /// </summary>
    Task<Result<PagedResult<ApplicationListItemResponse>>> GetPendingApplicationsAsync(
        int pageIndex = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取審核中申請列表
    /// </summary>
    Task<Result<PagedResult<ApplicationListItemResponse>>> GetApplicationsUnderReviewAsync(
        Guid? reviewerId = null,
        int pageIndex = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取已完成申請列表（通過/拒絕）
    /// </summary>
    Task<Result<PagedResult<ApplicationListItemResponse>>> GetCompletedApplicationsAsync(
        ApplicationStatus? status = null,
        int pageIndex = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 領取申請
    /// </summary>
    Task<Result<ApplicationResponse>> ClaimApplicationAsync(
        Guid applicationId,
        Guid reviewerId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 補寄申請通知信給申請人（聯絡人）。依目前狀態選信件：待審核／審核中＝申請提交確認，
    /// 已通過＝通過通知，未通過＝未通過通知（含原因）。申請人的信箱故障、信沒收到時，後台用這個補寄；
    /// 信箱填錯時可以帶更正後的信箱（只在尚未通過的申請可以改）。
    /// 寄信失敗會回失敗，不會改動申請；每次補寄都會寫進申請日誌。
    /// </summary>
    Task<Result<string>> ResendNotificationEmailAsync(
        Guid applicationId,
        string? newEmail,
        Guid operatorId,
        string? ipAddress,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 審核申請
    /// </summary>
    Task<Result<ApplicationResponse>> ReviewApplicationAsync(
        ReviewApplicationRequest request,
        string? ipAddress,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取申請統計
    /// </summary>
    Task<Result<ApplicationStatisticsResponse>> GetApplicationStatisticsAsync(
        CancellationToken cancellationToken = default);
}

/// <summary>
/// 申請統計響應
/// </summary>
public class ApplicationStatisticsResponse
{
    public int TotalApplications { get; set; }
    public int PendingReview { get; set; }
    public int UnderReview { get; set; }
    public int Approved { get; set; }
    public int Rejected { get; set; }
    public int Cancelled { get; set; }
    public int Draft { get; set; }
    public int TodayApplications { get; set; }
}
