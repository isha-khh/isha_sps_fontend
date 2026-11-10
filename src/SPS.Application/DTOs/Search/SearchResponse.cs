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

    /// <summary>keyword＝標題、內文等欄位含關鍵字；semantic＝沒有出現關鍵字，但 AI 語意判斷內容相關（前台標示「語意相關」）</summary>
    public string MatchType { get; set; } = "keyword";
}

/// <summary>
/// 依內容類型分組的搜尋結果。<see cref="TotalCount"/> 是該類型符合的總筆數，
/// <see cref="Items"/> 只放前幾筆（受 limit 限制），要看全部請連到 <see cref="MoreUrl"/>。
/// </summary>
public class SearchGroup
{
    /// <summary>news / serve / talent / tutoring / support / support-resource / company / demand / case / faq / video</summary>
    public string Type { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public int TotalCount { get; set; }
    public List<SearchResultItem> Items { get; set; } = new();

    /// <summary>該類型自己的列表頁（已帶關鍵字），查看全部用</summary>
    public string MoreUrl { get; set; } = string.Empty;

    /// <summary>已經由關鍵字比對到的項目 Id（語意搜尋補結果時用來去重；內部使用，不輸出）</summary>
    internal HashSet<string> MatchedIds { get; set; } = new();
}

public class SearchResponse
{
    public string Keyword { get; set; } = string.Empty;
    public int TotalCount { get; set; }
    public List<SearchGroup> Groups { get; set; } = new();
}
