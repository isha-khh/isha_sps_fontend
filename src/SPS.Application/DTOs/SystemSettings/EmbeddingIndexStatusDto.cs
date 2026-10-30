using SPS.Domain.Entities;

namespace SPS.Application.DTOs.SystemSettings;

/// <summary>
/// 單一來源類型（需求／供給端企業）的索引筆數
/// </summary>
public class EmbeddingSourceCountsDto
{
    /// <summary>應被索引的總筆數</summary>
    public int Total { get; set; }

    /// <summary>已成功索引</summary>
    public int Indexed { get; set; }

    /// <summary>索引失敗（含已達重試上限者）</summary>
    public int Failed { get; set; }

    /// <summary>尚未建立索引記錄</summary>
    public int Pending { get; set; }
}

/// <summary>
/// 索引筆數統計（Demand + Company）
/// </summary>
public class EmbeddingIndexCountsDto
{
    public EmbeddingSourceCountsDto Demand { get; set; } = new();
    public EmbeddingSourceCountsDto Company { get; set; } = new();

    /// <summary>失敗且已達重試上限（排程不會再自動重試，需手動重新索引）的筆數</summary>
    public int FailedExhausted { get; set; }

    /// <summary>用不同於目前設定模型建立的向量筆數（換模型後需要全量重新索引）</summary>
    public int OtherModelCount { get; set; }

    /// <summary>最近一次索引寫入時間（UTC）</summary>
    public DateTime? LastIndexedAt { get; set; }

    /// <summary>最近一筆失敗的錯誤訊息</summary>
    public string? LastError { get; set; }
}

/// <summary>
/// 背景索引工作狀態
/// </summary>
public class EmbeddingIndexJobDto
{
    /// <summary>idle／scanning／reindexing</summary>
    public string Phase { get; set; } = "idle";

    /// <summary>全量重新索引：總筆數、已處理、其中失敗</summary>
    public int ReindexTotal { get; set; }
    public int ReindexProcessed { get; set; }
    public int ReindexFailed { get; set; }

    /// <summary>全量重新索引開始／結束時間（UTC）。結束時間為 null 且 Phase=reindexing 表示進行中。</summary>
    public DateTime? ReindexStartedAt { get; set; }
    public DateTime? ReindexFinishedAt { get; set; }

    /// <summary>已收到全量重新索引要求，等待背景服務開始</summary>
    public bool ReindexQueued { get; set; }

    /// <summary>最近一次排程掃描時間（UTC）與當次處理筆數</summary>
    public DateTime? LastScanAt { get; set; }
    public int LastScanProcessed { get; set; }

    /// <summary>下次排程掃描時間（UTC）</summary>
    public DateTime? NextScanAt { get; set; }

    /// <summary>背景服務最近一次例外訊息</summary>
    public string? LastError { get; set; }
}

public class EmbeddingIndexStatusDto
{
    public bool IsEnabled { get; set; }
    public string? ActiveModel { get; set; }
    public EmbeddingIndexCountsDto Counts { get; set; } = new();
    public EmbeddingIndexJobDto Job { get; set; } = new();
}

/// <summary>
/// 全量重新索引的單一對象
/// </summary>
public record ReindexTarget(EmbeddingSourceType SourceType, string SourceId);
