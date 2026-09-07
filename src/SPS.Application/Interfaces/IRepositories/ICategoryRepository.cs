using SPS.Application.DTOs.Category;
using SPS.Application.DTOs.Common;
using SPS.Domain.Entities;
using SPS.Domain.Enums;

namespace SPS.Application.Interfaces.IRepositories;

public interface ICategoryRepository : IRepository<Category, int>
{
    Task<PagedResult<Category>> GetPagedAsync(
        CategoryQueryParameters parameters,
        CancellationToken cancellationToken = default);

    Task<List<Category>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<List<Category>> GetByTypeAsync(
        CategoryType type,
        CancellationToken cancellationToken = default);

    Task<List<Category>> GetRootCategoriesAsync(
        CategoryType? type = null,
        CancellationToken cancellationToken = default);

    Task<List<Category>> GetChildrenAsync(
        int parentId,
        CancellationToken cancellationToken = default);

    Task<Category?> GetByIdWithChildrenAsync(
        int id,
        CancellationToken cancellationToken = default);
}
