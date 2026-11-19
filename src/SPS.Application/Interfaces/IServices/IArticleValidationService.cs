namespace SPS.Application.Interfaces.IServices;

/// <summary>會被內容檢查的文章種類（都是後台用內容編輯器 Puck 編輯、前台公開顯示的內容）</summary>
public enum ArticleKind
{
    /// <summary>公告類（News，不分專區：最新消息、服務專區、補助、人才培育、產業輔導…）</summary>
    News,
    /// <summary>常見問題（內容是答案）</summary>
    Faq,
    /// <summary>產業案例</summary>
    Case,
    /// <summary>法規</summary>
    Regulation,
}

public sealed record ArticleRef(ArticleKind Kind, int Id);

/// <summary>內容檢查發現的一個問題。<see cref="Level"/> 是 error（會讓文章被轉成草稿）或 warning（只提醒）</summary>
public sealed record ArticleContentIssue(string Level, int BlockNumber, string BlockLabel, string Message)
{
    public bool IsError => Level == "error";
    public override string ToString() => $"第 {BlockNumber} 個區塊「{BlockLabel}」：{Message}";
}

public enum ArticleCheckOutcome
{
    /// <summary>沒有錯誤</summary>
    Ok,
    /// <summary>有錯誤，已轉成草稿並寫下原因</summary>
    Drafted,
    /// <summary>有錯誤，但這次只檢查不轉草稿（預覽模式）</summary>
    WouldDraft,
    /// <summary>文章不存在或已經是草稿，略過</summary>
    Skipped,
}

public sealed record ArticleCheckResult(
    ArticleKind Kind, int Id, string? Title, ArticleCheckOutcome Outcome, IReadOnlyList<ArticleContentIssue> Errors, string? Reason);

/// <summary>
/// 文章內容檢查服務：檢查後台內容編輯器（Puck）存下的 JSON 是否符合無障礙規則（標題不跳級、圖片要有替代文字、
/// 沒留著預設範例文字…），規則與後台編輯器的檢查（<c>SPS.AdminWeb/src/lib/puck/content-rules.ts</c>）一致。
/// 由後台「系統設定 → 內容檢查」啟動的背景任務（<see cref="IArticleCheckJobService"/>）逐篇呼叫 <see cref="CheckAsync"/>：
/// 有錯誤且選了「轉草稿」就把文章轉成草稿、在 <c>UnpublishReason</c> 欄位寫下原因。
/// </summary>
public interface IArticleValidationService
{
    /// <summary>純規則檢查，不碰資料庫。內容不是 Puck 格式（舊的純文字／HTML）回傳空清單</summary>
    IReadOnlyList<ArticleContentIssue> Validate(string? contentJson);

    /// <summary>目前已發布、需要檢查的文章（四種合起來）；任務用它算總數與進度百分比</summary>
    Task<List<ArticleRef>> ListPublishedAsync(CancellationToken ct = default);

    /// <summary>
    /// 檢查一篇文章。已發布且有「錯誤」：<paramref name="applyDraft"/> 為 true 就轉成草稿並寫下原因，否則只回報（<see cref="ArticleCheckOutcome.WouldDraft"/>）。
    /// </summary>
    Task<ArticleCheckResult> CheckAsync(ArticleKind kind, int id, bool applyDraft, CancellationToken ct = default);
}
