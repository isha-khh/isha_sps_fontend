using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Regulations;
using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IRepositories;

public interface IRegulationsRepository : IRepository<Regulations, int>
{
    Task<PagedResult<Regulations>> GetPagedAsync(
        RegulationsQueryParameters parameters,
        CancellationToken cancellationToken = default);

    Task<List<Regulations>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<List<Regulations>> GetByTypeAsync(
        short type,
        CancellationToken cancellationToken = default);

    Task<List<Regulations>> GetByCategoryAsync(
        int categoryId,
        CancellationToken cancellationToken = default);
}
