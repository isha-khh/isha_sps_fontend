using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Inquiry;

namespace SPS.Application.Interfaces.IServices;

public interface IInquiryService
{
    /// <summary>
    /// 企業名錄「取得聯繫窗口」成功之後記錄一張詢問單（誰、向哪家企業、勾選了哪些想了解的智慧技術），後台「詢問單」可以看到。
    /// 送出者的姓名、信箱、電話、公司、職稱取自會員資料；記錄失敗不影響取得聯繫窗口（只寫日誌）。
    /// </summary>
    Task RecordCompanyContactAsync(Guid memberId, Guid companyId, string companyName, IReadOnlyList<string> scopes, string? clientIp, CancellationToken ct = default);

    /// <summary>前台送出。<paramref name="memberId"/> 是登入會員（匿名為 null）；<paramref name="isEnterpriseMember"/> 用來檢查提案只開放企業會員</summary>
    Task<Result<bool>> CreateAsync(CreateInquiryRequest request, Guid? memberId, bool isEnterpriseMember, string? clientIp, CancellationToken ct = default);

    Task<Result<PagedResult<InquiryResponse>>> GetPagedAsync(InquiryQueryParameters parameters, CancellationToken ct = default);
    Task<Result<InquiryResponse>> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Result<InquiryResponse>> UpdateAsync(Guid id, UpdateInquiryRequest request, Guid? handledByUserId, CancellationToken ct = default);
    /// <summary>回覆會員：寫進該會員的收件匣（只有登入會員送出的詢問單可以），可選擇同時寄信</summary>
    Task<Result<InquiryResponse>> ReplyAsync(Guid id, ReplyInquiryRequest request, Guid? repliedByUserId, CancellationToken ct = default);
    Task<Result<bool>> DeleteAsync(Guid id, CancellationToken ct = default);
    Task<Result<InquiryCountsResponse>> GetCountsAsync(CancellationToken ct = default);

    /// <summary>某一類對象底下每個項目收到的詢問單數量（後台列表的「回應數量」），key 是 TargetKey</summary>
    Task<Result<Dictionary<string, int>>> GetCountsByTargetAsync(string targetType, CancellationToken ct = default);

    /// <summary>符合條件的詢問單（不分頁，匯出用），最多 <paramref name="max"/> 筆</summary>
    Task<Result<List<InquiryResponse>>> ListForExportAsync(InquiryQueryParameters parameters, int max, CancellationToken ct = default);
}
