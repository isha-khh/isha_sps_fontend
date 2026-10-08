using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Demand;

namespace SPS.Application.Interfaces.IServices;

public interface IDemandReplyService
{
    /// <summary>供應端會員送出回應；呼叫端要先確認身分是供應端</summary>
    Task<Result<bool>> CreateAsync(Guid memberId, int demandId, CreateDemandReplyRequest request, CancellationToken ct = default);

    Task<Result<List<MyDemandReplyResponse>>> GetMineAsync(Guid memberId, CancellationToken ct = default);

    Task<Result<PagedResult<DemandReplyAdminResponse>>> GetPagedAsync(DemandReplyQueryParameters parameters, CancellationToken ct = default);
    Task<Result<DemandReplyCountsResponse>> GetCountsAsync(CancellationToken ct = default);

    /// <summary>通過：狀態改為通過，並在背景寄信給刊登者與當下所有追蹤者</summary>
    Task<Result<DemandReplyAdminResponse>> ApproveAsync(int id, Guid? reviewedByUserId, CancellationToken ct = default);

    /// <summary>退回：記錄原因並在背景寄信通知供應業者</summary>
    Task<Result<DemandReplyAdminResponse>> RejectAsync(int id, string reason, Guid? reviewedByUserId, CancellationToken ct = default);

    /// <summary>該需求目前會收到回應的追蹤者人數（只算需求端會員）</summary>
    Task<int> CountFollowersAsync(int demandId, CancellationToken ct = default);
}
