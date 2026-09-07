using SPS.Application.Common;
using SPS.Application.DTOs.Category;
using SPS.Application.DTOs.Common;
using SPS.Domain.Enums;

namespace SPS.Application.Interfaces.IServices;

public interface ICategoryService
{
    Task<Result<PagedResult<CategoryResponse>>> GetPagedAsync(
        CategoryQueryParameters parameters,
        CancellationToken cancellationToken = default);

    Task<Result<CategoryResponse>> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default);

    Task<Result<List<CategoryResponse>>> GetByTypeAsync(
        CategoryType type,
        CancellationToken cancellationToken = default);

    Task<Result<List<CategoryTreeNode>>> GetCategoryTreeAsync(
        CategoryType? type = null,
        CancellationToken cancellationToken = default);

    Task<Result<CategoryResponse>> CreateAsync(
        CreateCategoryRequest request,
        CancellationToken cancellationToken = default);

    Task<Result<CategoryResponse>> UpdateAsync(
        int id,
        UpdateCategoryRequest request,
        CancellationToken cancellationToken = default);

    Task<Result<bool>> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default);
}
