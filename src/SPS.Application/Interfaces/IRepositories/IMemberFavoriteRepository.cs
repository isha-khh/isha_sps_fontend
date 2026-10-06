namespace SPS.Application.Interfaces.IRepositories;

/// <summary>會員的最愛（收藏的企業與需求）</summary>
public interface IMemberFavoriteRepository
{
    Task<List<Guid>> GetCompanyIdsAsync(Guid memberId, CancellationToken ct = default);
    Task<List<int>> GetDemandIdsAsync(Guid memberId, CancellationToken ct = default);
    Task<int> CountAsync(Guid memberId, CancellationToken ct = default);

    /// <summary>已經收藏過回傳 false，不重複新增</summary>
    Task<bool> AddCompanyAsync(Guid memberId, Guid companyId, CancellationToken ct = default);
    Task RemoveCompanyAsync(Guid memberId, Guid companyId, CancellationToken ct = default);
    Task<bool> AddDemandAsync(Guid memberId, int demandId, CancellationToken ct = default);
    Task RemoveDemandAsync(Guid memberId, int demandId, CancellationToken ct = default);
}
