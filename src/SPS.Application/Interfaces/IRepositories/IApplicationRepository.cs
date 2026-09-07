using SPS.Domain.Entities;
using SPS.Domain.Enums;

namespace SPS.Application.Interfaces.IRepositories;

/// <summary>
/// 會員申請倉儲接口
/// </summary>
public interface IApplicationRepository : IRepository<MemberApplication, Guid>
{
    /// <summary>
    /// 根據郵箱獲取申請列表
    /// </summary>
    Task<List<MemberApplication>> GetByEmailAsync(
        string email,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據申請編號獲取申請
    /// </summary>
    Task<MemberApplication?> GetByApplicationNumberAsync(
        string applicationNumber,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據狀態獲取申請列表
    /// </summary>
    Task<List<MemberApplication>> GetByStatusAsync(
        ApplicationStatus status,
        int pageIndex = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據多個狀態獲取申請列表（分頁）
    /// </summary>
    Task<List<MemberApplication>> GetByStatusesAsync(
        IEnumerable<ApplicationStatus> statuses,
        int pageIndex = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據多個狀態統計申請數量
    /// </summary>
    Task<int> CountByStatusesAsync(
        IEnumerable<ApplicationStatus> statuses,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據狀態統計申請數量
    /// </summary>
    Task<int> CountByStatusAsync(
        ApplicationStatus status,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據審核人ID獲取申請列表
    /// </summary>
    Task<List<MemberApplication>> GetByReviewerIdAsync(
        Guid reviewerId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取申請詳情（包含導航屬性）
    /// </summary>
    Task<MemberApplication?> GetDetailByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取申請統計
    /// </summary>
    Task<Dictionary<ApplicationStatus, int>> GetStatisticsAsync(
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 檢查郵箱是否已有待審核或審核中的申請
    /// </summary>
    Task<bool> HasPendingApplicationAsync(
        string email,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 檢查統一編號是否已注冊
    /// </summary>
    Task<bool> IsUnifiedSocialCreditCodeRegisteredAsync(
        string unifiedSocialCreditCode,
        CancellationToken cancellationToken = default);
}
