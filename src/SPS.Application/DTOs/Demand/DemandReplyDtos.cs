using System.ComponentModel.DataAnnotations;

namespace SPS.Application.DTOs.Demand;

/// <summary>供應業者對某一筆需求送出回應（送出後待後台審核）</summary>
public class CreateDemandReplyRequest
{
    [Required, MaxLength(50)]
    public string ContactName { get; set; } = string.Empty;

    [Required, MaxLength(320)]
    public string ContactEmail { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? ContactPhone { get; set; }

    [Required, MaxLength(3000)]
    public string Content { get; set; } = string.Empty;

    /// <summary>已了解回應經審核通過後會寄給刊登者與追蹤者</summary>
    public bool Acknowledged { get; set; }
}

/// <summary>供應業者在會員中心看到自己送出的回應與審核狀態</summary>
public class MyDemandReplyResponse
{
    public int Id { get; set; }
    public int DemandId { get; set; }
    public string DemandNumber { get; set; } = string.Empty;
    public string DemandName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;

    /// <summary>Pending／Approved／Rejected</summary>
    public string Status { get; set; } = string.Empty;
    public string? RejectReason { get; set; }
    public DateTime CreatedTime { get; set; }
    public DateTime? ReviewedAt { get; set; }
}

/// <summary>後台審核頁的回應資料</summary>
public class DemandReplyAdminResponse
{
    public int Id { get; set; }
    public int DemandId { get; set; }
    public string DemandNumber { get; set; } = string.Empty;
    public string DemandName { get; set; } = string.Empty;
    public Guid MemberId { get; set; }
    public string? CompanyName { get; set; }
    public string ContactName { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string? ContactPhone { get; set; }
    public string Content { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? RejectReason { get; set; }
    public DateTime CreatedTime { get; set; }
    public DateTime? ReviewedAt { get; set; }

    /// <summary>通過後寄出的收件人數</summary>
    public int? SentCount { get; set; }

    /// <summary>目前會收到這則回應的追蹤者人數（只有待審時有意義，審核頁用來提醒承辦人）</summary>
    public int FollowerCount { get; set; }
}

public class DemandReplyQueryParameters
{
    /// <summary>Pending／Approved／Rejected；空白 = 全部</summary>
    public string? Status { get; set; }
    public int? DemandId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class RejectDemandReplyRequest
{
    [Required, MaxLength(500)]
    public string Reason { get; set; } = string.Empty;
}

public class DemandReplyCountsResponse
{
    public int Pending { get; set; }
    public int Approved { get; set; }
    public int Rejected { get; set; }
}
