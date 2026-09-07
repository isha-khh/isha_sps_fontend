using SPS.Application.Common;
using SPS.Application.DTOs.About;
using SPS.Application.DTOs.Common;

namespace SPS.Application.Interfaces.IServices;

public interface IAboutService
{
    Task<Result<PagedResult<AboutResponse>>> GetPagedAsync(
        AboutQueryParameters parameters,
        CancellationToken cancellationToken = default);

    Task<Result<AboutResponse>> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default);

    Task<Result<List<AboutResponse>>> GetByTypeAsync(
        short type,
        CancellationToken cancellationToken = default);

    Task<Result<AboutResponse>> CreateAsync(
        CreateAboutRequest request,
        CancellationToken cancellationToken = default);

    Task<Result<AboutResponse>> UpdateAsync(
        int id,
        UpdateAboutRequest request,
        CancellationToken cancellationToken = default);

    Task<Result<bool>> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default);
}
