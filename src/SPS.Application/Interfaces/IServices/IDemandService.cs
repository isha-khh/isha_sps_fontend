using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Demand;
using SPS.Application.DTOs.MemberFavorite;

namespace SPS.Application.Interfaces.IServices;

public interface IDemandService
{
    Task<Result<PagedResult<DemandResponse>>> GetPagedAsync(DemandQueryParameters parameters, CancellationToken ct = default);
    Task<Result<DemandResponse>> GetByIdAsync(int id, CancellationToken ct = default);
    Task<Result<DemandResponse>> CreateAsync(CreateDemandRequest request, CancellationToken ct = default);

    /// <summary>會員從前台刊登需求：建立成未發布的需求（待後台審核），回傳需求編號</summary>
    Task<Result<string>> SubmitByMemberAsync(Guid memberId, SubmitDemandRequest request, CancellationToken ct = default);
    /// <summary>會員自己從前台刊登的需求（媒合資料維護）</summary>
    Task<Result<List<MemberDemandResponse>>> GetMemberDemandsAsync(Guid memberId, CancellationToken ct = default);

    /// <summary>會員修改自己刊登、還沒上架的需求；已上架或別人的需求不能改</summary>
    Task<Result<MemberDemandResponse>> UpdateByMemberAsync(Guid memberId, int id, UpdateMemberDemandRequest request, CancellationToken ct = default);

    /// <summary>會員撤回自己刊登、還沒上架的需求</summary>
    Task<Result<bool>> DeleteByMemberAsync(Guid memberId, int id, CancellationToken ct = default);

    Task<Result<DemandResponse>> UpdateAsync(int id, UpdateDemandRequest request, string? publisherEmail = null, CancellationToken ct = default);
    Task<Result<bool>> DeleteAsync(int id, CancellationToken ct = default);
    Task<Result<DemandStatisticsDto>> GetStatisticsAsync(CancellationToken ct = default);

    /// <summary>發布需求時，預設勾選通知的供應業者「標籤符合度」門檻（百分比）；系統管理員在「內容設定」調整，預設 70</summary>
    Task<int> GetMatchThresholdPercentAsync();
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
