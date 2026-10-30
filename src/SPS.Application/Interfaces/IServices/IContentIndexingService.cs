using SPS.Application.DTOs.SystemSettings;
using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// AI 向量媒合搜尋的索引服務：把 Demand/Company 的內容轉成向量寫入 ContentEmbedding。
/// 事件觸發（即時） + 排程掃描（安全網/重試/初次 backfill）雙軌並行，
/// 詳見 docs/設計/AI向量媒合搜尋設計.md §4。
/// </summary>
public interface IContentIndexingService
{
    /// <summary>
    /// 索引單一 Demand（事件觸發路徑用）。內容 hash 沒變則跳過，不重複呼叫 embedding API。
    /// 失敗時只記 log，不拋例外中斷呼叫端流程。force=true 時不比對 hash，一律重新呼叫 embedding API（全量重新索引用）。
    /// 回傳 true 表示該筆目前處於已索引狀態（含內容沒變而跳過），false 表示索引失敗或來源不存在。
    /// </summary>
    Task<bool> IndexDemandAsync(int demandId, CancellationToken ct = default, bool force = false);

    /// <summary>
    /// 索引單一 Company（事件觸發路徑用）。同上。
    /// </summary>
    Task<bool> IndexCompanyAsync(Guid companyId, CancellationToken ct = default, bool force = false);

    /// <summary>
    /// 排程掃描路徑：找出需要（重新）索引的 Demand/Company，各處理最多 batchSize 筆。
    /// 條件：完全沒有 ContentEmbedding 記錄的 / SourceTextHash 對不上的 / Status=Failed 且 RetryCount &lt; 5 的。
    /// 回傳實際處理筆數。
    /// </summary>
    Task<int> ReconcileBatchAsync(int batchSize, CancellationToken ct = default);

    /// <summary>
    /// 全量重新索引的對象清單：所有 Demand + 供給端（Supplier/Both）Company。
    /// </summary>
    Task<IReadOnlyList<ReindexTarget>> ListReindexTargetsAsync(CancellationToken ct = default);

    /// <summary>
    /// 索引進度統計（設定頁顯示用）。activeModel 為目前設定的模型名稱，用來統計「用舊模型建的向量」筆數。
    /// </summary>
    Task<EmbeddingIndexCountsDto> GetIndexCountsAsync(string? activeModel, CancellationToken ct = default);
}
