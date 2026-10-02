namespace SPS.Application.DTOs.Search;

/// <summary>
/// 全站搜尋結果的單筆項目。<see cref="Url"/> 是站內路徑（不含站台 basePath），前台直接連過去。
/// </summary>
public class SearchResultItem
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public DateTime? Date { get; set; }
    public string? ImageUrl { get; set; }
    public string Url { get; set; } = string.Empty;
}

/// <summary>
/// 依內容類型分組的搜尋結果。<see cref="TotalCount"/> 是該類型符合的總筆數，
/// <see cref="Items"/> 只放前幾筆（受 limit 限制），要看全部請連到 <see cref="MoreUrl"/>。
/// </summary>
public class SearchGroup
{
    /// <summary>news / case / faq / video</summary>
    public string Type { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public int TotalCount { get; set; }
    public List<SearchResultItem> Items { get; set; } = new();

    /// <summary>該類型自己的列表頁（已帶關鍵字），查看全部用</summary>
    public string MoreUrl { get; set; } = string.Empty;
}

public class SearchResponse
{
    public string Keyword { get; set; } = string.Empty;
    public int TotalCount { get; set; }
    public List<SearchGroup> Groups { get; set; } = new();
}
