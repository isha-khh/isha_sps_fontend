namespace SPS.Application.DTOs.Analytics;

/// <summary>
/// Google Analytics 同步狀態（存在 SystemSetting，Category <c>GoogleAnalyticsSyncStatus</c>）。
/// 手動與自動同步每次執行後都會更新「最近一次」的結果；自動同步另外記錄「今天做完了沒、重試幾次」，
/// 讓後端重啟、或服務在排定時間沒開著，之後也能補跑，而且不會同一天重複跑。
/// </summary>
public class AnalyticsSyncStatusDto
{
    /// <summary>最近一次執行時間（UTC）</summary>
    public DateTime? LastRunUtc { get; set; }

    /// <summary>最近一次是否成功</summary>
    public bool? LastSuccess { get; set; }

    /// <summary>最近一次成功的時間（UTC）</summary>
    public DateTime? LastSuccessUtc { get; set; }

    /// <summary>最近一次的結果說明（失敗時是原因）</summary>
    public string? LastMessage { get; set; }

    /// <summary>最近一次是誰觸發的：<c>auto</c>（排程）或 <c>manual</c>（儀表板按鈕）</summary>
    public string? LastTrigger { get; set; }

    /// <summary>最近一次同步的天數</summary>
    public int LastDays { get; set; }

    /// <summary>自動同步已完成的台灣日期（<c>yyyy-MM-dd</c>）；等於今天就不會再跑</summary>
    public string? AutoDoneDate { get; set; }

    /// <summary>自動同步最近一次嘗試的台灣日期，與 <see cref="AutoAttempts"/> 搭配限制失敗重試次數</summary>
    public string? AutoAttemptDate { get; set; }

    public int AutoAttempts { get; set; }

    public DateTime? LastAutoAttemptUtc { get; set; }
}

/// <summary>後台儀表板顯示用：自動同步的設定與最近一次結果</summary>
public class AnalyticsSyncStatusResponse
{
    /// <summary>Google Analytics 的資源 ID 與憑證是否都已設定</summary>
    public bool Configured { get; set; }
    public bool AutoSyncEnabled { get; set; }
    public string AutoSyncTime { get; set; } = "03:00";
    public int AutoSyncDays { get; set; } = 3;
    public DateTime? LastRunUtc { get; set; }
    public bool? LastSuccess { get; set; }
    public DateTime? LastSuccessUtc { get; set; }
    public string? LastMessage { get; set; }
    public string? LastTrigger { get; set; }
    public int LastDays { get; set; }
}
