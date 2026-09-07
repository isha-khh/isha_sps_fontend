using SPS.Application.DTOs.About;
using SPS.Application.DTOs.Common;
using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IRepositories;

public interface IAboutRepository : IRepository<About, int>
{
    Task<PagedResult<About>> GetPagedAsync(
        AboutQueryParameters parameters,
        CancellationToken cancellationToken = default);

    Task<List<About>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<List<About>> GetByTypeAsync(
        short type,
        CancellationToken cancellationToken = default);
}
