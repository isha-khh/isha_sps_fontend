using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Product;

namespace SPS.Application.Interfaces.IServices;

public interface IProductService
{
    Task<Result<PagedResult<ProductListItemResponse>>> GetPagedAsync(
        ProductQueryParameters parameters, CancellationToken cancellationToken = default);
    Task<Result<ProductResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Result<ProductResponse>> CreateAsync(
        CreateProductRequest request, CancellationToken cancellationToken = default);
    Task<Result<ProductResponse>> UpdateAsync(
        int id, UpdateProductRequest request, CancellationToken cancellationToken = default);
    Task<Result<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default);
}
