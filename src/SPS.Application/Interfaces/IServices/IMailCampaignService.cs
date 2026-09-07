using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.MailCampaign;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 群發郵件活動服務
/// </summary>
public interface IMailCampaignService
{
    /// <summary>
    /// 排入佇列（同步：解析收件人 + 落 Campaign + Recipient rows；實際寄送由 worker 處理）
    /// </summary>
    Task<Result<EnqueueCampaignResponse>> EnqueueAsync(
        SendCampaignRequest request,
        string? operatorId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 由背景 worker 呼叫：挑下一個到期的 Queued campaign 處理。回傳 true 表示有處理一個
    /// </summary>
    Task<bool> ProcessNextDueAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 取消尚未開始的活動（只接受 Queued 狀態）
    /// </summary>
    Task<Result> CancelAsync(Guid campaignId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 重試指定活動的失敗收件人：建立一個只包含原 Failed 收件人的新活動（PerRecipient 模式專用）
    /// </summary>
    Task<Result<EnqueueCampaignResponse>> RetryFailedAsync(
        Guid sourceCampaignId,
        string? operatorId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 分頁查詢活動列表
    /// </summary>
    Task<Result<PagedResult<CampaignListItemResponse>>> ListAsync(
        CampaignListQueryParameters parameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 取得活動詳情
    /// </summary>
    Task<Result<CampaignDetailResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// 預覽收件人數（不寄送，僅解析）
    /// </summary>
    Task<Result<int>> PreviewRecipientCountAsync(
        List<Guid> companyIds,
        List<Guid> memberIds,
        CampaignRecipientFilter? filter,
        bool broadcast,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 預覽收件人清單（前 N 筆）
    /// </summary>
    Task<Result<PreviewRecipientListResponse>> PreviewRecipientListAsync(
        PreviewRecipientListRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 測試寄送：將主旨/內容套上提供的變數值與系統版型，寄到指定 email；不建立 Campaign 紀錄
    /// </summary>
    Task<Result> TestSendAsync(TestSendCampaignRequest request, CancellationToken cancellationToken = default);
}
