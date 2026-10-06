using System.ComponentModel.DataAnnotations;
using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Inquiry;

/// <summary>前台送出詢問單。哪些欄位必填依 <see cref="Type"/> 而定，由 InquiryService 檢查</summary>
public class CreateInquiryRequest
{
    public InquiryType Type { get; set; }

    [MaxLength(100)] public string? Name { get; set; }
    [MaxLength(320)] public string? Email { get; set; }
    [MaxLength(50)] public string? Phone { get; set; }
    [MaxLength(200)] public string? CompanyName { get; set; }
    [MaxLength(100)] public string? Unit { get; set; }
    [MaxLength(100)] public string? JobTitle { get; set; }
    [MaxLength(2000)] public string? Message { get; set; }

    [MaxLength(50)] public string? TargetType { get; set; }
    [MaxLength(100)] public string? TargetKey { get; set; }
    [MaxLength(300)] public string? TargetTitle { get; set; }

    /// <summary>電子報的產業代碼等額外資料</summary>
    [MaxLength(200)] public string? Industry { get; set; }

    /// <summary>已閱讀並同意個資蒐集告知（匿名表單必須為 true）</summary>
    public bool ConsentAccepted { get; set; }

    /// <summary>誘捕欄位：真人看不到所以不會填，有值就當作機器人</summary>
    public string? Website { get; set; }
}

public class InquiryResponse
{
    public Guid Id { get; set; }
    public InquiryType Type { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public InquiryStatus Status { get; set; }
    public Guid? MemberId { get; set; }
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? CompanyName { get; set; }
    public string? Unit { get; set; }
    public string? JobTitle { get; set; }
    public string? Message { get; set; }
    public string? TargetType { get; set; }
    public string? TargetKey { get; set; }
    public string? TargetTitle { get; set; }
    public string? Industry { get; set; }
    public string? HandlerNote { get; set; }
    public DateTime? HandledTime { get; set; }
    public DateTime CreatedTime { get; set; }
}

public class InquiryQueryParameters
{
    public InquiryType? Type { get; set; }
    public InquiryStatus? Status { get; set; }
    public string? Search { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class UpdateInquiryRequest
{
    public InquiryStatus Status { get; set; }

    [MaxLength(2000)] public string? HandlerNote { get; set; }
}

public class InquiryCountsResponse
{
    public int New { get; set; }
    public int InProgress { get; set; }
    public int Closed { get; set; }
}
