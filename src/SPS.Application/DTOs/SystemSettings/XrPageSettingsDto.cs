namespace SPS.Application.DTOs.SystemSettings;

/// <summary>
/// 「XR」頁（前台 /talent/xr）的頁籤設定，後台「服務專區 → 人才培育 → XR 頁面」維護（issue #37）。
/// 每個頁籤有自己的名稱、介紹文字與模組下載連結；頁籤的順序就是清單順序。沒設定過時是原本的兩個頁籤：
/// 「動火作業」（用前台內建的介紹版面）與「有機電操作」（敬請期待）。
/// </summary>
public class XrPageSettingsDto
{
    public List<XrTabDto> Tabs { get; set; } = XrPageValidator.DefaultTabs();
}

public class XrTabDto
{
    /// <summary>頁籤識別碼（小寫英數與連字號），後台新增時由系統產生；前台用它當 HTML id，改名不會變</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>頁籤名稱，例如「動火作業」</summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>
    /// 使用前台內建的「動火作業」介紹版面（為什麼需要 XR、訓練情境、六階段流程…）。只有識別碼 <see cref="XrPageValidator.FireWorkId"/>
    /// 的頁籤可以開；開啟時忽略 <see cref="Introduction"/>，下載連結以 <see cref="Links"/> 為準、沒填就沿用「頁面設定 → 下載資源」的 XR 訓練模組
    /// </summary>
    public bool UseBuiltInLayout { get; set; }

    /// <summary>介紹文字，空白行分段；沒有介紹、也沒有下載連結（且沒用內建版面）時前台顯示「敬請期待」</summary>
    public string Introduction { get; set; } = string.Empty;

    /// <summary>模組下載連結（外部網址，安裝檔通常放在雲端空間）；有多個時前台點「立即下載」會列出讓使用者選</summary>
    public List<XrDownloadLinkDto> Links { get; set; } = new();
}

public class XrDownloadLinkDto
{
    /// <summary>連結名稱，例如「Windows 版」；空白時前台顯示「下載連結」</summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>只接受 http／https 的完整網址</summary>
    public string Url { get; set; } = string.Empty;
}

/// <summary>XR 頁籤設定的驗證與整理：去頭尾空白、限制數量與長度、連結只接受 http／https、識別碼不重複</summary>
public static class XrPageValidator
{
    public const string FireWorkId = "fire-work";

    private const int MaxTabs = 8;
    private const int MaxLinks = 10;

    private static readonly System.Text.RegularExpressions.Regex IdFormat =
        new("^[a-z0-9][a-z0-9-]{0,39}$", System.Text.RegularExpressions.RegexOptions.Compiled);

    public static List<XrTabDto> DefaultTabs() => new()
    {
        new XrTabDto { Id = FireWorkId, Label = "動火作業", UseBuiltInLayout = true },
        new XrTabDto { Id = "organic-electric", Label = "有機電操作" },
    };

    private static string Clean(string? value) => (value ?? string.Empty).Trim();

    public static (XrPageSettingsDto Settings, string? Error) Normalize(XrPageSettingsDto input)
    {
        var result = new XrPageSettingsDto { Tabs = new() };
        var tabs = (input.Tabs ?? new()).Where(t => t != null).ToList();
        if (tabs.Count == 0) return (result, "至少要有一個頁籤");
        if (tabs.Count > MaxTabs) return (result, $"頁籤最多 {MaxTabs} 個");

        var usedIds = new HashSet<string>();
        foreach (var tab in tabs)
        {
            var label = Clean(tab.Label);
            if (label.Length == 0) return (result, "每個頁籤都要填名稱");
            if (label.Length > 20) return (result, $"頁籤名稱「{label}」太長（上限 20 字）");

            // 識別碼：沿用合法且不重複的，否則產生新的（新增頁籤時前端不用管）
            var id = Clean(tab.Id).ToLowerInvariant();
            if (!IdFormat.IsMatch(id) || !usedIds.Add(id))
            {
                do { id = "tab-" + Guid.NewGuid().ToString("N")[..8]; } while (!usedIds.Add(id));
            }

            var introduction = Clean(tab.Introduction);
            if (introduction.Length > 3000) return (result, $"頁籤「{label}」的介紹太長（上限 3000 字）");

            var links = new List<XrDownloadLinkDto>();
            foreach (var link in (tab.Links ?? new()).Where(l => l != null))
            {
                var url = Clean(link.Url);
                var linkLabel = Clean(link.Label);
                if (url.Length == 0 && linkLabel.Length == 0) continue; // 整筆空白就丟掉
                if (url.Length == 0) return (result, $"頁籤「{label}」的下載連結「{linkLabel}」沒有填網址");
                if (url.Length > 2000 || !Uri.TryCreate(url, UriKind.Absolute, out var uri) || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
                    return (result, $"頁籤「{label}」的下載連結網址不正確（只接受 http／https 的完整網址）");
                if (linkLabel.Length > 100) return (result, $"頁籤「{label}」的下載連結名稱太長（上限 100 字）");
                links.Add(new XrDownloadLinkDto { Label = linkLabel, Url = url });
            }
            if (links.Count > MaxLinks) return (result, $"頁籤「{label}」的下載連結最多 {MaxLinks} 個");

            result.Tabs.Add(new XrTabDto
            {
                Id = id,
                Label = label,
                // 內建版面是「動火作業」專用的，其他頁籤不能開
                UseBuiltInLayout = tab.UseBuiltInLayout && id == FireWorkId,
                Introduction = introduction,
                Links = links,
            });
        }
        return (result, null);
    }
}
