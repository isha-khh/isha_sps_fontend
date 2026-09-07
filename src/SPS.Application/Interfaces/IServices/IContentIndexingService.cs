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
    /// 失敗時只記 log，不拋例外中斷呼叫端流程。
    /// </summary>
    Task IndexDemandAsync(int demandId, CancellationToken ct = default);

    /// <summary>
    /// 索引單一 Company（事件觸發路徑用）。同上。
    /// </summary>
    Task IndexCompanyAsync(Guid companyId, CancellationToken ct = default);

    /// <summary>
    /// 排程掃描路徑：找出需要（重新）索引的 Demand/Company，各處理最多 batchSize 筆。
    /// 條件：完全沒有 ContentEmbedding 記錄的 / SourceTextHash 對不上的 / Status=Failed 且 RetryCount &lt; 5 的。
    /// 回傳實際處理筆數。
    /// </summary>
    Task<int> ReconcileBatchAsync(int batchSize, CancellationToken ct = default);
}
