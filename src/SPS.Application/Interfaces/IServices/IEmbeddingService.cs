using SPS.Application.Common;
using SPS.Application.DTOs.SystemSettings;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// AI 語意搜尋 embedding 服務（透過 LiteLLM 呼叫 embedding 模型）。
/// 詳見 docs/設計/AI向量媒合搜尋設計.md §2.2。
/// </summary>
public interface IEmbeddingService
{
    /// <summary>
    /// 將文件端文字（Demand/Company 簡介等被檢索內容）轉成向量，不加 instruction prefix。
    /// </summary>
    Task<Result<float[]>> EmbedDocumentAsync(string text, CancellationToken ct = default);

    /// <summary>
    /// 將查詢端文字（使用者搜尋詞、或用 Demand 反查供給端時的 Demand 內容）轉成向量，
    /// 會自動加上 instruction prefix（§2.2.2 已驗證對 qwen3-embedding 有效）。
    /// </summary>
    Task<Result<float[]>> EmbedQueryAsync(string queryText, CancellationToken ct = default);

    /// <summary>
    /// 使用指定設定測試連線（不儲存），回傳向量維度與延遲，供設定頁「測試連線」使用。
    /// </summary>
    Task<EmbeddingTestResult> TestConnectionAsync(EmbeddingSettingsDto settings, CancellationToken ct = default);

    /// <summary>
    /// 取得目前設定的 embedding 模型名稱（不呼叫 API，純讀設定），供索引服務記錄 ContentEmbedding.Model 用。
    /// </summary>
    Task<string?> GetActiveModelNameAsync(CancellationToken ct = default);
}
