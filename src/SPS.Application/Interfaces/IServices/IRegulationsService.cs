using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Regulations;

namespace SPS.Application.Interfaces.IServices;

public interface IRegulationsService
{
    Task<Result<PagedResult<RegulationsResponse>>> GetPagedAsync(
        RegulationsQueryParameters parameters,
        CancellationToken cancellationToken = default);

    Task<Result<RegulationsResponse>> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default);

    Task<Result<List<RegulationsResponse>>> GetByTypeAsync(
        short type,
        CancellationToken cancellationToken = default);

    Task<Result<List<RegulationsResponse>>> GetByCategoryAsync(
        int categoryId,
        CancellationToken cancellationToken = default);

    Task<Result<RegulationsResponse>> CreateAsync(
        CreateRegulationsRequest request,
        CancellationToken cancellationToken = default);

    Task<Result<RegulationsResponse>> UpdateAsync(
        int id,
        UpdateRegulationsRequest request,
        CancellationToken cancellationToken = default);

    Task<Result<bool>> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default);
}
