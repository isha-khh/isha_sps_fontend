using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IServices;

/// <summary>內容檢查發現的一個問題。<see cref="Level"/> 是 error（會讓文章被轉成草稿）或 warning（只提醒）</summary>
public sealed record ArticleContentIssue(string Level, int BlockNumber, string BlockLabel, string Message)
{
    public bool IsError => Level == "error";
    public override string ToString() => $"第 {BlockNumber} 個區塊「{BlockLabel}」：{Message}";
}

/// <summary>內容檢查（背景索引時跑）的選項，設定檔區段 <c>ContentValidation</c></summary>
public sealed class ContentValidationOptions
{
    public const string SectionName = "ContentValidation";

    /// <summary>
    /// 發現「錯誤」等級的問題時，是否把已發布的文章轉成草稿。預設 true；設成 false 只寫 log、不動文章
    /// （第一次在正式機跑之前，想先看看會影響哪些文章時用：環境變數 <c>ContentValidation__DraftOnViolation=false</c>）。
    /// </summary>
    public bool DraftOnViolation { get; set; } = true;
}

/// <summary>
/// 文章內容檢查服務：檢查後台內容編輯器（Puck）存下的 JSON 是否符合無障礙規則（標題不跳級、圖片要有替代文字…），
/// 規則與後台編輯器的檢查（<c>SPS.AdminWeb/src/lib/puck/content-rules.ts</c>）一致。
/// 背景索引（排程補漏與全量重新索引）索引每一篇文章之前會先跑 <see cref="EnforceAsync"/>：有錯誤就把文章轉成草稿、
/// 在 <c>UnpublishReason</c> 欄位寫下原因，並略過索引。
/// </summary>
public interface IArticleValidationService
{
    /// <summary>純規則檢查，不碰資料庫。內容不是 Puck 格式（舊的純文字／HTML）回傳空清單</summary>
    IReadOnlyList<ArticleContentIssue> Validate(string? contentJson);

    /// <summary>
    /// 檢查一篇文章（News、Faq、Case），已發布且有「錯誤」就轉成草稿並寫下原因。
    /// 回傳 true 表示這次把文章轉成草稿了（呼叫端不用再索引它）；沒有問題、本來就是草稿、
    /// 來源類型不支援、或 <see cref="ContentValidationOptions.DraftOnViolation"/> 關閉時回傳 false。
    /// </summary>
    Task<bool> EnforceAsync(EmbeddingSourceType sourceType, string sourceId, CancellationToken ct = default);
}
