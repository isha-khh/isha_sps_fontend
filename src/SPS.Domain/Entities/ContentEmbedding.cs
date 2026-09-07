using SPS.Domain.Common;

namespace SPS.Domain.Entities;

/// <summary>
/// 內容向量索引（AI 語意媒合搜尋用）。
/// 每筆記錄對應一個來源（Demand/Company/Product）的 embedding 向量，獨立於本體資料表，
/// 換模型/調整維度時只需重建這張表，不影響核心業務資料。
/// 詳見 docs/設計/AI向量媒合搜尋設計.md §3.1。
/// </summary>
public class ContentEmbedding : BaseEntity<Guid>
{
    /// <summary>
    /// 來源類型（Demand / Company / Product）
    /// </summary>
    public EmbeddingSourceType SourceType { get; set; }

    /// <summary>
    /// 來源記錄 ID（Demand.Id(int)/Company.Id(Guid)/Product.Id(int) 轉字串存）
    /// </summary>
    public string SourceId { get; set; } = string.Empty;

    /// <summary>
    /// 原文 SHA256 hash，判斷內容是否變動、是否需要重新索引
    /// </summary>
    public string SourceTextHash { get; set; } = string.Empty;

    /// <summary>
    /// 使用的 embedding 模型名稱（例如 "qwen3-embedding"）
    /// </summary>
    public string Model { get; set; } = string.Empty;

    /// <summary>
    /// 向量維度
    /// </summary>
    public int Dimension { get; set; }

    /// <summary>
    /// 向量本體。Domain 層維持 float[]（不依賴 Pgvector 套件），
    /// Infrastructure 層的 EF Core 設定負責轉換成 pgvector 的 vector 型別。
    /// Status = Failed 時可能為 null。
    /// </summary>
    public float[]? Embedding { get; set; }

    /// <summary>
    /// 索引狀態：Indexed / Failed，供排程掃描判斷是否需要重試
    /// </summary>
    public EmbeddingStatus Status { get; set; }

    /// <summary>
    /// 失敗重試次數
    /// </summary>
    public int RetryCount { get; set; }

    /// <summary>
    /// 最近一次失敗的錯誤訊息
    /// </summary>
    public string? LastError { get; set; }
}

public enum EmbeddingSourceType
{
    Demand = 1,
    Company = 2,
    Product = 3
}

public enum EmbeddingStatus
{
    Indexed = 1,
    Failed = 2
}
