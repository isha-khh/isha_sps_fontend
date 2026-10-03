namespace SPS.Application.DTOs.SystemSettings;

/// <summary>
/// 前台頁尾（Footer）的外部連結設定。
///
/// 欄位留空＝前台不顯示那個項目，不會再出現連到 `#` 的失效連結。
/// 網址只接受 http／https（<see cref="FunctionZoneUrl"/> 另外允許站內路徑 `/…`），
/// 由 <c>FooterLinksValidator</c> 檢查，避免後台填入 `javascript:` 之類的網址變成存在於每一頁的 XSS。
/// </summary>
public class FooterLinksSettingsDto
{
    /// <summary>「功能專區」連結（站內路徑如 /serve，或 http／https 網址）</summary>
    public string FunctionZoneUrl { get; set; } = string.Empty;

    // ===== 社群 =====
    public string LineUrl { get; set; } = string.Empty;
    public string FacebookUrl { get; set; } = string.Empty;
    public string InstagramUrl { get; set; } = string.Empty;
    public string YouTubeUrl { get; set; } = string.Empty;
    public string ThreadsUrl { get; set; } = string.Empty;
    public string PodcastUrl { get; set; } = string.Empty;

    // ===== 頁尾標章（圖片固定，只能設定點擊後的連結）=====
    /// <summary>無障礙網頁標章 2.0（通常是檢測平台的驗證網址）</summary>
    public string AccessibilityBadgeUrl { get; set; } = string.Empty;

    /// <summary>經濟部產業發展署</summary>
    public string IdaUrl { get; set; } = "https://www.ida.gov.tw/";

    /// <summary>工業安全衛生協會</summary>
    public string IshaUrl { get; set; } = string.Empty;
}

/// <summary>
/// 頁尾連結的驗證：只放行 http／https（與功能專區的站內路徑），其餘一律拒絕
/// </summary>
public static class FooterLinksValidator
{
    private const int MaxLength = 500;

    /// <summary>
    /// 回傳錯誤訊息；沒有問題回 null
    /// </summary>
    public static string? Validate(FooterLinksSettingsDto s)
    {
        var fields = new (string Label, string Value, bool AllowInternal)[]
        {
            ("功能專區", s.FunctionZoneUrl, true),
            ("LINE", s.LineUrl, false),
            ("Facebook", s.FacebookUrl, false),
            ("Instagram", s.InstagramUrl, false),
            ("YouTube", s.YouTubeUrl, false),
            ("Threads", s.ThreadsUrl, false),
            ("Podcast", s.PodcastUrl, false),
            ("無障礙網頁標章", s.AccessibilityBadgeUrl, false),
            ("經濟部產業發展署", s.IdaUrl, false),
            ("工業安全衛生協會", s.IshaUrl, false),
        };

        foreach (var (label, value, allowInternal) in fields)
        {
            if (string.IsNullOrWhiteSpace(value)) continue;
            var v = value.Trim();

            if (v.Length > MaxLength) return $"「{label}」的網址太長（上限 {MaxLength} 字元）";

            // 站內路徑：單一斜線開頭；「//」開頭是 protocol-relative，會被當成外部網址，不放行
            if (allowInternal && v.StartsWith('/') && !v.StartsWith("//") && !v.Contains('\\')) continue;

            if (!Uri.TryCreate(v, UriKind.Absolute, out var uri) ||
                (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            {
                return allowInternal
                    ? $"「{label}」必須是 http／https 網址，或以 / 開頭的站內路徑"
                    : $"「{label}」必須是 http／https 網址";
            }
        }

        return null;
    }

    /// <summary>
    /// 去掉前後空白後儲存
    /// </summary>
    public static FooterLinksSettingsDto Normalize(FooterLinksSettingsDto s) => new()
    {
        FunctionZoneUrl = s.FunctionZoneUrl?.Trim() ?? string.Empty,
        LineUrl = s.LineUrl?.Trim() ?? string.Empty,
        FacebookUrl = s.FacebookUrl?.Trim() ?? string.Empty,
        InstagramUrl = s.InstagramUrl?.Trim() ?? string.Empty,
        YouTubeUrl = s.YouTubeUrl?.Trim() ?? string.Empty,
        ThreadsUrl = s.ThreadsUrl?.Trim() ?? string.Empty,
        PodcastUrl = s.PodcastUrl?.Trim() ?? string.Empty,
        AccessibilityBadgeUrl = s.AccessibilityBadgeUrl?.Trim() ?? string.Empty,
        IdaUrl = s.IdaUrl?.Trim() ?? string.Empty,
        IshaUrl = s.IshaUrl?.Trim() ?? string.Empty,
    };
}
