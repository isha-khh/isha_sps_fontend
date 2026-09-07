namespace SPS.Application.DTOs.SystemSettings;

/// <summary>
/// AI 語意搜尋（Embedding）設定
/// </summary>
public class EmbeddingSettingsDto
{
    /// <summary>
    /// 是否啟用 AI 語意搜尋。停用時「相似供給端業者」面板僅顯示標籤比對結果，
    /// 背景索引服務也不會呼叫外部 AI 服務。
    /// </summary>
    public bool IsEnabled { get; set; }

    /// <summary>
    /// LiteLLM 服務位址（OpenAI 相容 /embeddings 端點的 base URL）
    /// </summary>
    public string BaseUrl { get; set; } = string.Empty;

    /// <summary>
    /// LiteLLM API Key
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>
    /// Embedding 模型名稱（例如 "qwen3-embedding"）
    /// </summary>
    public string Model { get; set; } = string.Empty;

    /// <summary>
    /// 查詢端（Demand）的 instruction prefix，用於不對稱檢索。留空則後端使用預設值。
    /// </summary>
    public string? QueryInstructionPrefix { get; set; }
}

/// <summary>
/// 測試 Embedding 連線的結果
/// </summary>
public class EmbeddingTestResult
{
    public bool Success { get; set; }
    public string? Message { get; set; }

    /// <summary>
    /// 實際回傳的向量維度。若跟目前已索引資料的維度不同，代表換了模型，需要全量重新索引。
    /// </summary>
    public int? Dimension { get; set; }

    /// <summary>
    /// 呼叫延遲（毫秒）
    /// </summary>
    public int? LatencyMs { get; set; }
}
