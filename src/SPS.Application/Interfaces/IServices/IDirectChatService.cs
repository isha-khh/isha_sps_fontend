using SPS.Application.Common;
using SPS.Application.DTOs.Chat;
using SPS.Application.DTOs.Common;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 會員之間的對話：只能從「審核通過的需求回應」由該需求的刊登者對回應者開啟，對話綁定在那則回應上；
/// 另外負責封鎖、檢舉，以及傳訊息前的規則檢查（客服對話也共用）。
/// 平常承辦人員看不到會員之間的對話內容，只有被檢舉的對話才能由檢舉單開啟審閱。
/// </summary>
public interface IDirectChatService
{
    /// <summary>需求刊登者對審核通過的回應者開啟對話（已經有就回傳那一個）。回傳對話 Id</summary>
    Task<Result<long>> OpenForReplyAsync(Guid publisherMemberId, int replyId, CancellationToken ct = default);

    /// <summary>刊登者自己刊登的某筆需求，收到的審核通過的回應</summary>
    Task<Result<List<ReceivedReplyDto>>> GetReceivedRepliesAsync(Guid publisherMemberId, int demandId, CancellationToken ct = default);

    /// <summary>
    /// 補上會員對話列表的需求名稱、封鎖狀態，並把沒有綁定需求回應的舊會員對話濾掉（那是規則訂定前就存在的資料，不在前台顯示）
    /// </summary>
    Task<List<ChatRecordDto>> EnrichAsync(Guid memberId, List<ChatRecordDto> chats, CancellationToken ct = default);

    /// <summary>傳訊息前的規則檢查；可以傳回 null，不可以回傳要顯示給會員的原因</summary>
    Task<string?> CheckCanSendAsync(Guid memberId, long chatRecordId, CancellationToken ct = default);

    /// <summary>另一位參與者的會員 Id（會員之間的對話）；不是會員之間的對話或不是參與者回傳 null</summary>
    Task<Guid?> GetPeerMemberIdAsync(Guid memberId, long chatRecordId, CancellationToken ct = default);

    Task<Result<bool>> BlockAsync(Guid memberId, long chatRecordId, CancellationToken ct = default);
    Task<Result<bool>> UnblockAsync(Guid memberId, long chatRecordId, CancellationToken ct = default);
    Task<Result<bool>> ReportAsync(Guid memberId, long chatRecordId, ReportChatRequest request, CancellationToken ct = default);

    // ===== 後台 =====
    Task<Result<PagedResult<ChatReportAdminDto>>> GetReportsAsync(bool? reviewed, int page, int pageSize, CancellationToken ct = default);
    Task<Result<ChatReportDetailDto>> GetReportDetailAsync(int reportId, CancellationToken ct = default);
    Task<Result<ChatReportDetailDto>> UpdateReportAsync(int reportId, UpdateChatReportRequest request, Guid? handledByUserId, CancellationToken ct = default);
}
