using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Demand;

namespace SPS.Application.Interfaces.IServices;

public interface IDemandService
{
    Task<Result<PagedResult<DemandResponse>>> GetPagedAsync(DemandQueryParameters parameters, CancellationToken ct = default);
    Task<Result<DemandResponse>> GetByIdAsync(int id, CancellationToken ct = default);
    Task<Result<DemandResponse>> CreateAsync(CreateDemandRequest request, CancellationToken ct = default);
    Task<Result<DemandResponse>> UpdateAsync(int id, UpdateDemandRequest request, string? publisherEmail = null, CancellationToken ct = default);
    Task<Result<bool>> DeleteAsync(int id, CancellationToken ct = default);
    Task<Result<DemandStatisticsDto>> GetStatisticsAsync(CancellationToken ct = default);
    Task<Result<DemandTagsResponse>> GetTagsAsync(int id, CancellationToken ct = default);
    Task<Result<DemandTagsResponse>> SetTagsAsync(int id, SetDemandTagsRequest request, CancellationToken ct = default);
    Task<Result<List<SimilarCompanyResponse>>> GetSimilarCompaniesAsync(List<int> tagIds, CancellationToken ct = default);

    /// <summary>
    /// AI 語意搜尋：依需求內容找出語意相似的供給端業者（純向量 + CSLS 簡化版偏誤修正）。
    /// 詳見 docs/設計/AI向量媒合搜尋設計.md §5.4。
    /// </summary>
    Task<Result<List<SimilarCompanyByVectorResponse>>> GetSimilarCompaniesByVectorAsync(int demandId, int topN = 20, CancellationToken ct = default);

    /// <summary>
    /// 即時預覽：不需先儲存需求，用當下輸入的名稱/介紹/標籤做一次性查詢，不寫入索引。
    /// 給新增需求頁面「AI 推薦」按鈕用。
    /// </summary>
    Task<Result<List<SimilarCompanyByVectorResponse>>> PreviewSimilarCompaniesByVectorAsync(
        string? name, string? introduction, List<int>? tagIds, int topN = 20, CancellationToken ct = default);

    Task<Result<List<DemandNotificationResponse>>> GetNotificationsAsync(int demandId, CancellationToken ct = default);
}
