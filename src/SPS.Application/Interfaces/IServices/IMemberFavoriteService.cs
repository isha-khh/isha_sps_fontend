using SPS.Application.Common;
using SPS.Application.DTOs.MemberFavorite;

namespace SPS.Application.Interfaces.IServices;

public interface IMemberFavoriteService
{
    Task<Result<MemberFavoritesResponse>> GetAsync(Guid memberId, CancellationToken ct = default);
    Task<FavoriteIdsResponse> GetIdsAsync(Guid memberId, CancellationToken ct = default);
    Task<Result<bool>> AddCompanyAsync(Guid memberId, Guid companyId, CancellationToken ct = default);
    Task<Result<bool>> RemoveCompanyAsync(Guid memberId, Guid companyId, CancellationToken ct = default);
    Task<Result<bool>> AddDemandAsync(Guid memberId, int demandId, CancellationToken ct = default);
    Task<Result<bool>> RemoveDemandAsync(Guid memberId, int demandId, CancellationToken ct = default);
}
