using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Demand;
using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IRepositories;

public interface IDemandRepository : IRepository<Demand, int>
{
    Task<PagedResult<Demand>> GetPagedAsync(DemandQueryParameters parameters, CancellationToken ct = default);
}
