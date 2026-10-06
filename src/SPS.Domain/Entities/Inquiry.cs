using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

/// <summary>
/// 詢問單：前台「留下資料等人回覆」的表單（提案、訂閱解方、下載申請、索取補助資料、訂閱電子報）共用一張表，
/// 後台「詢問單」收件匣檢視與標記處理進度。內容欄位多半是選填——每種表單只會填它有的那幾欄。
/// </summary>
public class Inquiry : BaseEntity<Guid>
{
    public InquiryType Type { get; set; }
    public InquiryStatus Status { get; set; } = InquiryStatus.New;

    /// <summary>送出的會員（登入送出才有；匿名表單為空）</summary>
    public Guid? MemberId { get; set; }

    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? CompanyName { get; set; }

    /// <summary>單位</summary>
    public string? Unit { get; set; }

    /// <summary>職稱</summary>
    public string? JobTitle { get; set; }

    /// <summary>補充說明</summary>
    public string? Message { get; set; }

    /// <summary>這張單針對的對象種類（例如 Demand、ServeItem、SupportResource），沒有特定對象時為空</summary>
    public string? TargetType { get; set; }

    /// <summary>對象的識別（需求 Id、項目代號等）</summary>
    public string? TargetKey { get; set; }

    /// <summary>送出當下的對象標題，後台不用再查就看得出是哪一筆</summary>
    public string? TargetTitle { get; set; }

    /// <summary>其他欄位（JSON 文字），例如電子報的產業代碼</summary>
    public string? Extra { get; set; }

    public string? ClientIp { get; set; }

    /// <summary>後台處理備註</summary>
    public string? HandlerNote { get; set; }

    public Guid? HandledByUserId { get; set; }
    public DateTime? HandledTime { get; set; }
}
