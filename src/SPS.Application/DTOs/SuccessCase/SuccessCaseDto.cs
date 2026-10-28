namespace SPS.Application.DTOs.SuccessCase;

/// <summary>
/// 成功案例 DTO
/// </summary>
public class SuccessCaseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string Industry { get; set; } = string.Empty;
    public string? CoverImageUrl { get; set; }
    public string Summary { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public List<string>? Tags { get; set; }
    public DateTime? PublishedDate { get; set; }
    public bool IsPublished { get; set; }
    public int ViewCount { get; set; }
    public List<Guid> CompanyIds { get; set; } = new();

    /// <summary>
    /// 關聯企業的公開簡介（只含名稱、標誌、簡介、網址；只列已審核通過且啟用的企業）。只有案例詳情 API 會填，列表不填。
    /// 公司簡介是管理員自己選要放在案例上的內容，不受「訪客可查看企業名錄詳情」設定影響。
    /// </summary>
    public List<SuccessCaseCompanyIntroDto> Companies { get; set; } = new();
    public DateTime CreatedTime { get; set; }
    public DateTime UpdatedTime { get; set; }
}

/// <summary>
/// 案例詳情頁「公司簡介」區塊用的企業公開資料
/// </summary>
public class SuccessCaseCompanyIntroDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Introduction { get; set; }
    public string? OrgUrl { get; set; }
    public string? PhotoUrl { get; set; }
}
