namespace SPS.Application.DTOs.Demand;

/// <summary>
/// AI 語意搜尋即時預覽請求：新增需求頁尚未儲存前，用當下輸入內容做一次性查詢。
/// </summary>
public class PreviewSimilarCompaniesRequest
{
    public string? Name { get; set; }
    public string? Introduction { get; set; }
    public List<int>? TagIds { get; set; }
}
