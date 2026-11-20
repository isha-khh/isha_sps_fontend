using System.Text.Json;
using System.Text.RegularExpressions;

namespace SPS.Application.DTOs.SystemSettings;

public class GoogleAnalyticsSettingsDto
{
    public string PropertyId { get; set; } = string.Empty;
    public JsonElement? CredentialsJson { get; set; }

    /// <summary>是否每天自動從 Google Analytics 同步流量資料（後台儀表板與分析報表用）；預設開啟，GA 沒設定時自動略過</summary>
    public bool AutoSyncEnabled { get; set; } = true;

    /// <summary>每天自動同步的時間（台灣時間 <c>HH:mm</c>）；預設凌晨 3:00</summary>
    public string AutoSyncTime { get; set; } = "03:00";

    /// <summary>每次自動同步往回抓幾天（1～30）。GA 的資料常在隔天或兩天後才修正，預設抓最近 3 天比只抓昨天準確</summary>
    public int AutoSyncDays { get; set; } = 3;

    private static readonly Regex TimePattern = new(@"^([01]\d|2[0-3]):[0-5]\d$", RegexOptions.Compiled);

    /// <summary>檢查自動同步的時間與天數；回傳錯誤訊息，沒問題回 null</summary>
    public string? ValidateAutoSync()
    {
        if (!TimePattern.IsMatch(AutoSyncTime ?? string.Empty)) return "自動同步時間格式必須是 HH:mm（例如 03:00）";
        if (AutoSyncDays is < 1 or > 30) return "自動同步天數必須是 1 到 30";
        return null;
    }
}
