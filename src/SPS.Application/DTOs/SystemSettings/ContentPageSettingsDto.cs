namespace SPS.Application.DTOs.SystemSettings;

/// <summary>
/// 「關於我們」頁（前台 /about）的文字內容，後台「內容管理 → 頁面設定」維護。背景圖、台灣地圖等圖形仍由前台程式控制，
/// 這裡只管文字。沒有設定過時就是這裡的預設值（與改成可維護之前前台寫死的內容相同）。
/// </summary>
public class AboutPageSettingsDto
{
    /// <summary>計畫名稱（頁面第一段的標題）</summary>
    public string Title { get; set; } = "智慧石化永續發展計畫";

    /// <summary>計畫簡介</summary>
    public string Intro { get; set; } =
        "以高雄石化產業聚落為核心，導入智慧科技與創新應用，強化製程安全、環境永續與營運韌性，促進產業升級轉型，打造安全、智慧、永續的石化產業生態。";

    /// <summary>計畫歷程時間軸，依顯示順序（通常由早到晚）</summary>
    public List<AboutMilestoneDto> Milestones { get; set; } = new()
    {
        new() { Year = "2024", Title = "盤點產業需求", Items = new() { "深入石化場域，盤點製程、設備、巡檢及安全管理痛點，建立石化產業智慧安全需求與技術應用方向。" } },
        new() { Year = "2025", Title = "孵化技術缺口", Items = new() { "推動AI影像辨識、智慧巡檢、設備監測等技術進入石化場域，透過輔導及補助降低產業導入門檻。" } },
        new() { Year = "2026", Title = "擴大推動對象", Items = new() { "聚焦高雄石化相關上下游產業實際需求，媒合國內智慧科技業者，推動AI與智慧安全技術PoC驗證，強化火災、洩漏、設備異常等風險之即時辨識與預警能力。" } },
        new() { Year = "2027", Title = "形成產業服務生態鏈", Items = new() { "彙整場域實證成果，建立可複製的石化智慧安全應用模式，促進不同廠區、製程及高風險場域導入應用。" } },
    };

    /// <summary>「願景」區塊的小標</summary>
    public string VisionTitle { get; set; } = "願景";

    /// <summary>願景標語第一段（一般字色）</summary>
    public string VisionLine { get; set; } = "立足高雄";

    /// <summary>願景標語第二段（強調色）</summary>
    public string VisionHighlight { get; set; } = "放眼全台";
}

public class AboutMilestoneDto
{
    public string Year { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public List<string> Items { get; set; } = new();
}

/// <summary>
/// 補助專區（前台 /support）頁首的四個固定資訊區塊（適用對象／補助類別／補助金額／聯繫諮詢），後台「內容管理 → 頁面設定」維護。
/// 沒有設定過時就是這裡的預設值（與改成可維護之前前台寫死的內容相同）。
/// </summary>
public class SupportInfoSettingsDto
{
    public List<SupportInfoBlockDto> Blocks { get; set; } = new()
    {
        new()
        {
            Icon = "bi-person", Title = "適用對象",
            Items = new() { new() { Label = "符合產業類別", Children = new() { "17石油及煤製品製造業", "18化學材料及肥料製造業", "19其他化學製品製造業" } } },
            FullTextResourceKey = "support-notice", FullTextLabel = "申請須知",
        },
        new()
        {
            Icon = "bi-card-checklist", Title = "補助類別",
            Items = new()
            {
                new() { Label = "基礎升級", Children = new() { "導入感測技術和物聯網（IoT），幫助管理者迅速掌握工廠運行情況，並在發生異常時及時反應" } },
                new() { Label = "進階升級", Children = new() { "運用人工智慧技術，透過深度學習、數據分析等技術，幫助工廠預測和防範安全風險" } },
            },
        },
        new()
        {
            Icon = "bi-currency-dollar", Title = "補助金額",
            Items = new() { new() { Label = "基礎升級 - 上限400萬元" }, new() { Label = "進階升級 - 上限800萬元" } },
        },
        new()
        {
            Icon = "bi-telephone", Title = "聯繫諮詢",
            Items = new() { new() { Label = "李先生 - 02-2755-5615 #37" }, new() { Label = "吳小姐 - 02-2755-5615 #53" } },
        },
    };
}

public class SupportInfoBlockDto
{
    /// <summary>圖示（Bootstrap Icons 名稱，必須在 <see cref="ContentPageValidator.SupportIcons"/> 內）</summary>
    public string Icon { get; set; } = "bi-info-circle";

    public string Title { get; set; } = string.Empty;
    public List<SupportInfoItemDto> Items { get; set; } = new();

    /// <summary>區塊底部「完整內容請參閱〈…〉」連到哪個下載資源（後台「下載資源」的 key）；空＝不顯示這一行</summary>
    public string? FullTextResourceKey { get; set; }

    /// <summary>「完整內容請參閱」後面顯示的文字（例如「申請須知」）</summary>
    public string? FullTextLabel { get; set; }
}

public class SupportInfoItemDto
{
    public string Label { get; set; } = string.Empty;
    public List<string> Children { get; set; } = new();
}

/// <summary>「關於我們」與補助專區資訊區塊設定的驗證與整理：去頭尾空白、丟掉空白項目、限制數量與長度</summary>
public static class ContentPageValidator
{
    public static readonly string[] SupportIcons =
    {
        "bi-person", "bi-card-checklist", "bi-currency-dollar", "bi-telephone", "bi-geo-alt",
        "bi-building", "bi-info-circle", "bi-calendar4-week", "bi-file-earmark-text", "bi-clipboard-check",
    };

    private const int MaxText = 500;
    private const int MaxMilestones = 12;
    private const int MaxLines = 10;
    private const int MaxBlocks = 8;
    private const int MaxItems = 20;

    private static string Clean(string? value) => (value ?? string.Empty).Trim();

    private static string? TooLong(string label, string value, int max = MaxText) =>
        value.Length > max ? $"「{label}」太長（上限 {max} 字）" : null;

    public static (AboutPageSettingsDto Settings, string? Error) NormalizeAbout(AboutPageSettingsDto input)
    {
        var s = new AboutPageSettingsDto
        {
            Title = Clean(input.Title),
            Intro = Clean(input.Intro),
            VisionTitle = Clean(input.VisionTitle),
            VisionLine = Clean(input.VisionLine),
            VisionHighlight = Clean(input.VisionHighlight),
            Milestones = new(),
        };
        foreach (var (label, value, max) in new[]
        {
            ("計畫名稱", s.Title, 100), ("計畫簡介", s.Intro, 1000),
            ("願景小標", s.VisionTitle, 50), ("願景標語", s.VisionLine, 50), ("願景強調標語", s.VisionHighlight, 50),
        })
        {
            var error = TooLong(label, value, max);
            if (error != null) return (s, error);
        }
        if (s.Title.Length == 0) return (s, "請填寫計畫名稱");

        var milestones = (input.Milestones ?? new()).Where(m => m != null).ToList();
        if (milestones.Count > MaxMilestones) return (s, $"計畫歷程最多 {MaxMilestones} 筆");
        foreach (var m in milestones)
        {
            var year = Clean(m.Year);
            var title = Clean(m.Title);
            var lines = (m.Items ?? new()).Select(Clean).Where(l => l.Length > 0).ToList();
            if (year.Length == 0 && title.Length == 0 && lines.Count == 0) continue; // 整筆空白就丟掉
            if (year.Length == 0) return (s, "計畫歷程每一筆都要填年份");
            if (title.Length == 0) return (s, $"計畫歷程「{year}」要填標題");
            if (lines.Count > MaxLines) return (s, $"計畫歷程「{year}」說明最多 {MaxLines} 點");
            var error = TooLong("年份", year, 20) ?? TooLong("計畫歷程標題", title, 100) ?? lines.Select(l => TooLong("計畫歷程說明", l)).FirstOrDefault(e => e != null);
            if (error != null) return (s, error);
            s.Milestones.Add(new AboutMilestoneDto { Year = year, Title = title, Items = lines });
        }
        return (s, null);
    }

    public static (SupportInfoSettingsDto Settings, string? Error) NormalizeSupportInfo(SupportInfoSettingsDto input)
    {
        var s = new SupportInfoSettingsDto { Blocks = new() };
        var blocks = (input.Blocks ?? new()).Where(b => b != null).ToList();
        if (blocks.Count > MaxBlocks) return (s, $"資訊區塊最多 {MaxBlocks} 個");

        foreach (var b in blocks)
        {
            var title = Clean(b.Title);
            var items = new List<SupportInfoItemDto>();
            foreach (var item in b.Items ?? new())
            {
                var label = Clean(item?.Label);
                var children = (item?.Children ?? new()).Select(Clean).Where(c => c.Length > 0).ToList();
                if (label.Length == 0 && children.Count == 0) continue;
                if (label.Length == 0) return (s, $"區塊「{title}」的項目要填文字");
                if (children.Count > MaxItems) return (s, $"區塊「{title}」的子項目最多 {MaxItems} 個");
                var error = TooLong("項目文字", label) ?? children.Select(c => TooLong("子項目文字", c)).FirstOrDefault(e => e != null);
                if (error != null) return (s, error);
                items.Add(new SupportInfoItemDto { Label = label, Children = children });
            }

            var linkKey = Clean(b.FullTextResourceKey);
            var linkLabel = Clean(b.FullTextLabel);
            if (title.Length == 0 && items.Count == 0 && linkKey.Length == 0) continue; // 整個區塊空白就丟掉
            if (title.Length == 0) return (s, "每個資訊區塊都要填標題");
            if (items.Count > MaxItems) return (s, $"區塊「{title}」的項目最多 {MaxItems} 個");
            if (!SupportIcons.Contains(b.Icon)) return (s, $"區塊「{title}」的圖示不在可選清單內");
            var titleError = TooLong("區塊標題", title, 50) ?? TooLong("完整內容連結文字", linkLabel, 50);
            if (titleError != null) return (s, titleError);
            if (linkKey.Length > 0)
            {
                if (DownloadResourceCatalog.Find(linkKey) == null) return (s, $"區塊「{title}」連結的下載資源不存在");
                if (linkLabel.Length == 0) return (s, $"區塊「{title}」要填連結文字");
            }
            s.Blocks.Add(new SupportInfoBlockDto
            {
                Icon = b.Icon, Title = title, Items = items,
                FullTextResourceKey = linkKey.Length > 0 ? linkKey : null,
                FullTextLabel = linkKey.Length > 0 ? linkLabel : null,
            });
        }
        return (s, null);
    }
}

/// <summary>
/// 「產業AI」外部連結開關（前台主選單、首頁、網站導覽裡的「產業AI」），後台「內容管理 → 頁面設定」維護。
/// 關閉（預設）＝維持原本的內部頁面（服務專區「產業AI」分類）；開啟＝所有「產業AI」連結改連到這裡填的外部網址。
/// </summary>
public class IndustryAiLinkSettingsDto
{
    /// <summary>true＝使用外部連結；false＝維持內部頁面（預設）</summary>
    public bool Enabled { get; set; }

    /// <summary>外部連結網址（只接受 http／https）；開啟時必填</summary>
    public string Url { get; set; } = string.Empty;

    /// <summary>是否另開新視窗（外部網站預設是）</summary>
    public bool NewTab { get; set; } = true;
}

/// <summary>前台公開資料：只有「開啟且網址有效」才會是 Enabled，否則一律當作關閉（髒資料不輸出）</summary>
public class IndustryAiLinkPublicDto
{
    public bool Enabled { get; set; }
    public string Url { get; set; } = string.Empty;
    public bool NewTab { get; set; } = true;
}

public static class IndustryAiLinkValidator
{
    public const int MaxUrlLength = 500;

    /// <summary>檢查並整理；開啟時網址必須是 http／https 的絕對網址。關閉時網址可以留空或保留上次填的（方便再開啟）</summary>
    public static (IndustryAiLinkSettingsDto Settings, string? Error) Normalize(IndustryAiLinkSettingsDto input)
    {
        var url = (input.Url ?? string.Empty).Trim();
        var s = new IndustryAiLinkSettingsDto { Enabled = input.Enabled, Url = url, NewTab = input.NewTab };
        if (url.Length > MaxUrlLength) return (s, $"外部連結太長（上限 {MaxUrlLength} 字）");
        if (url.Length > 0 && !IsValidExternalUrl(url)) return (s, "外部連結只能是 http:// 或 https:// 開頭的完整網址");
        if (s.Enabled && url.Length == 0) return (s, "開啟外部連結時必須填寫網址");
        return (s, null);
    }

    public static bool IsValidExternalUrl(string url) =>
        Uri.TryCreate(url, UriKind.Absolute, out var uri) && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps) && !string.IsNullOrEmpty(uri.Host);

    public static IndustryAiLinkPublicDto ToPublic(IndustryAiLinkSettingsDto s)
    {
        var url = (s.Url ?? string.Empty).Trim();
        var valid = s.Enabled && IsValidExternalUrl(url);
        return new IndustryAiLinkPublicDto { Enabled = valid, Url = valid ? url : string.Empty, NewTab = s.NewTab };
    }
}
