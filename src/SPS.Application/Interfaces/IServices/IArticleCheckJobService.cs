using SPS.Domain.Enums;

namespace SPS.Application.Interfaces.IServices;

/// <summary>檢查結果裡有問題的一篇（任務狀態裡最多留 <c>MaxFindings</c> 筆，給後台顯示）</summary>
public sealed class ArticleCheckFindingDto
{
    public string Kind { get; set; } = string.Empty;
    public int Id { get; set; }
    public string? Title { get; set; }
    public string Reason { get; set; } = string.Empty;
    /// <summary>true＝已轉成草稿；false＝預覽模式只回報</summary>
    public bool Drafted { get; set; }
}

public sealed class ArticleCheckJobDto
{
    public Guid Id { get; set; }
    /// <summary>Queued／Running／Completed／Cancelled／Failed</summary>
    public string Status { get; set; } = "Queued";
    /// <summary>true＝有問題的文章會轉成草稿；false＝預覽，只檢查不動文章</summary>
    public bool ApplyDraft { get; set; }
    public int Total { get; set; }
    public int Checked { get; set; }
    /// <summary>有「錯誤」的文章篇數</summary>
    public int Flagged { get; set; }
    /// <summary>其中已轉成草稿的篇數</summary>
    public int Drafted { get; set; }
    public int Percent { get; set; }
    public List<ArticleCheckFindingDto> Findings { get; set; } = new();
    public string? RequestedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    public string? Error { get; set; }
}

public sealed class ArticleCheckEnqueueResult
{
    public ArticleCheckJobDto Job { get; set; } = new();
    /// <summary>已經有任務排隊中或執行中，回傳的是那一個</summary>
    public bool AlreadyActive { get; set; }
}

/// <summary>
/// 後台「內容檢查」任務：逐篇檢查所有已發布的文章（<see cref="ArticleKind"/> 四種），有問題的依選項轉成草稿。
/// 同一時間只會有一個任務（排隊中或執行中時再按會回傳同一個）；狀態只存在記憶體，後端重啟後歸零。
/// 進度即時推給後台（<see cref="IAdminRealtimeNotifier"/>），結束時寫一則「系統」通知給啟動的人。
/// </summary>
public interface IArticleCheckJobService
{
    /// <param name="applyDraft">true＝有問題的轉草稿；false＝預覽（只檢查）</param>
    /// <param name="requestedBy">顯示用的啟動者名稱</param>
    /// <param name="recipient">結束通知的收件人（後台使用者的 Email 或 Id，鈴鐺依這個撈）；null 就不寫通知</param>
    Task<ArticleCheckEnqueueResult> EnqueueAsync(bool applyDraft, string? requestedBy, string? recipient, CancellationToken ct);

    /// <summary>最近一個任務（進行中或剛結束的）；從來沒跑過回傳 null</summary>
    ArticleCheckJobDto? GetLatest();

    bool Cancel(Guid jobId);
}

/// <summary>
/// 把事件即時推給在線的後台使用者。實作在 API 專案（SignalR hub），背景服務在 Infrastructure，所以用介面隔開；
/// 沒有實作時（測試、背景工具）用什麼都不做的版本。
/// </summary>
public interface IAdminRealtimeNotifier
{
    /// <param name="requiredPermission">只推給有這項後台權限的連線（連線時依 token 的 Permissions claim 分組；
    /// 目前支援 <see cref="UserPermission.ManageSettings"/>、<see cref="UserPermission.ManageFiles"/>）</param>
    Task PublishAsync(UserPermission requiredPermission, string eventName, object payload, CancellationToken ct = default);
}
