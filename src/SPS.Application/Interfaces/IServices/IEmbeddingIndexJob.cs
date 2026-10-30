using SPS.Application.DTOs.SystemSettings;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// AI 向量索引背景工作的狀態與控制（單例）。設定頁用它顯示進度、要求全量重新索引或立即掃描，
/// 實際執行由 IndexReconciliationBackgroundService 負責。
/// </summary>
public interface IEmbeddingIndexJob
{
    EmbeddingIndexJobDto GetSnapshot();

    /// <summary>
    /// 要求全量重新索引。已有全量重新索引在排隊或進行中時回傳 false。
    /// </summary>
    bool RequestFullReindex();

    /// <summary>
    /// 要求背景服務立刻跑一輪排程掃描（補缺漏／重試失敗），不等下一個間隔。
    /// </summary>
    void RequestScan();
}
