namespace SPS.Application.DTOs.SystemSettings;

/// <summary>
/// 企業名錄（前台「我要媒合 → 企業名錄」）的排序設定，後台「內容管理 → 頁面設定」維護。
/// 一組有順序的規則：排在前面的規則優先，前面的規則分不出高下時才看下一條；全部都分不出來時，最後固定用「最新加入在前」、再用編號，
/// 讓換頁時順序穩定。沒設定過＝只有「新舊（新的在前）」一條，跟原本的行為一致。
/// </summary>
public class EnterpriseDirectorySortSettingsDto
{
    public List<EnterpriseSortRuleDto> Rules { get; set; } = EnterpriseDirectorySortKeys.DefaultRules();
}

public class EnterpriseSortRuleDto
{
    /// <summary><see cref="EnterpriseDirectorySortKeys"/> 其中之一</summary>
    public string Key { get; set; } = string.Empty;

    /// <summary>是否啟用；沒啟用的規則不參與排序（但保留在清單裡，方便管理員之後再打開）</summary>
    public bool Enabled { get; set; }

    /// <summary>
    /// 方向。新舊：true＝新的在前、false＝舊的在前。資料完整度／圖片／標籤：true＝多（有）的在前、false＝少（沒有）的在前。
    /// </summary>
    public bool Descending { get; set; } = true;
}

/// <summary>可用的排序依據</summary>
public static class EnterpriseDirectorySortKeys
{
    /// <summary>資料完整度：公司專頁基本資料（簡介、主要產品暨服務、電話、地址、網址、成立日期、資本總額）有填的欄位數</summary>
    public const string Completeness = "completeness";

    /// <summary>圖片：有沒有 LOGO／公司圖片</summary>
    public const string Image = "image";

    /// <summary>標籤：勾選的企業標籤數量</summary>
    public const string Tags = "tags";

    /// <summary>成功對接次數：這家供給端企業出現在幾筆需求的對接結果裡（issue #98；同一筆需求只算一次）</summary>
    public const string Matches = "matches";

    /// <summary>新舊：企業加入（建立）的時間</summary>
    public const string Newest = "createdTime";

    /// <summary>設定存在 <c>SystemSetting</c> 的 Category</summary>
    public const string SettingCategory = "PageEnterpriseSort";

    public static readonly string[] All = { Completeness, Image, Tags, Matches, Newest };

    /// <summary>預設：只有「新舊（新的在前）」啟用，行為與設定功能出現之前相同</summary>
    public static List<EnterpriseSortRuleDto> DefaultRules() => new()
    {
        new() { Key = Completeness, Enabled = false, Descending = true },
        new() { Key = Image, Enabled = false, Descending = true },
        new() { Key = Tags, Enabled = false, Descending = true },
        new() { Key = Matches, Enabled = false, Descending = true },
        new() { Key = Newest, Enabled = true, Descending = true },
    };
}

public static class EnterpriseDirectorySortValidator
{
    /// <summary>
    /// 驗證並整理：只接受已知的依據、不可重複；少的依據補在最後（停用）。傳進來的順序就是優先順序。
    /// </summary>
    public static (EnterpriseDirectorySortSettingsDto Settings, string? Error) Normalize(EnterpriseDirectorySortSettingsDto input)
    {
        var rules = new List<EnterpriseSortRuleDto>();
        foreach (var rule in input.Rules ?? new())
        {
            var key = rule.Key?.Trim() ?? string.Empty;
            if (!EnterpriseDirectorySortKeys.All.Contains(key))
                return (input, $"不支援的排序依據：{rule.Key}");
            if (rules.Any(r => r.Key == key))
                return (input, $"排序依據重複：{key}");
            rules.Add(new EnterpriseSortRuleDto { Key = key, Enabled = rule.Enabled, Descending = rule.Descending });
        }

        foreach (var key in EnterpriseDirectorySortKeys.All.Where(k => rules.All(r => r.Key != k)))
        {
            var fallback = EnterpriseDirectorySortKeys.DefaultRules().First(r => r.Key == key);
            rules.Add(new EnterpriseSortRuleDto { Key = key, Enabled = false, Descending = fallback.Descending });
        }

        return (new EnterpriseDirectorySortSettingsDto { Rules = rules }, null);
    }
}
