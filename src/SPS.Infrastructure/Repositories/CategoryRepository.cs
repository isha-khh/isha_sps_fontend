using Microsoft.EntityFrameworkCore;
using SPS.Application.DTOs.Category;
using SPS.Application.DTOs.Common;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Domain.Enums;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Repositories.Common;

namespace SPS.Infrastructure.Repositories;

/// <summary>
/// 分類倉儲實現
/// </summary>
public class CategoryRepository : Repository<Category, int>, ICategoryRepository
{
    public CategoryRepository(ApplicationDbContext context) : base(context)
    {
    }

    public override async Task<Category?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(c => c.Parent)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<Category?> GetByIdWithChildrenAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(c => c.Parent)
            .Include(c => c.Children)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<PagedResult<Category>> GetPagedAsync(
        CategoryQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet
            .Include(c => c.Parent)
            .AsQueryable();

        // 類型過濾
        if (parameters.Type.HasValue)
        {
            query = query.Where(c => c.Type == parameters.Type.Value);
        }

        // 搜索過濾
        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            query = query.Where(c => c.Name != null && c.Name.Contains(parameters.Search));
        }

        // 發布狀態過濾
        if (parameters.Published.HasValue)
        {
            query = query.Where(c => c.Published == parameters.Published.Value);
        }

        // 父分類過濾
        if (parameters.ParentId.HasValue)
        {
            if (parameters.ParentId.Value == 0)
            {
                // ParentId = 0 表示查詢根分類
                query = query.Where(c => c.ParentId == null);
            }
            else
            {
                query = query.Where(c => c.ParentId == parameters.ParentId.Value);
            }
        }

        // 總數
        var totalCount = await query.CountAsync(cancellationToken);

        // 排序
        query = ApplySorting(query, parameters.SortBy, parameters.Descending);

        // 分頁
        var items = await query
            .Skip((parameters.Page - 1) * parameters.PageSize)
            .Take(parameters.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Category>
        {
            Items = items,
            TotalCount = totalCount,
            Page = parameters.Page,
            PageSize = parameters.PageSize
        };
    }

    public async Task<List<Category>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(c => c.Parent)
            .OrderBy(c => c.Type)
            .ThenBy(c => c.Ordinal)
            .ThenBy(c => c.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Category>> GetByTypeAsync(
        CategoryType type,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(c => c.Parent)
            .Where(c => c.Type == type)
            .OrderBy(c => c.Ordinal)
            .ThenBy(c => c.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Category>> GetRootCategoriesAsync(
        CategoryType? type = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet
            .Where(c => c.ParentId == null);

        if (type.HasValue)
        {
            query = query.Where(c => c.Type == type.Value);
        }

        return await query
            .OrderBy(c => c.Type)
            .ThenBy(c => c.Ordinal)
            .ThenBy(c => c.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Category>> GetChildrenAsync(
        int parentId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(c => c.ParentId == parentId)
            .OrderBy(c => c.Ordinal)
            .ThenBy(c => c.Name)
            .ToListAsync(cancellationToken);
    }

    private IQueryable<Category> ApplySorting(
        IQueryable<Category> query,
        string? sortBy,
        bool descending)
    {
        if (string.IsNullOrWhiteSpace(sortBy))
        {
            return query
                .OrderBy(c => c.Type)
                .ThenBy(c => c.Ordinal)
                .ThenBy(c => c.Name);
        }

        return sortBy.ToLower() switch
        {
            "name" => descending
                ? query.OrderByDescending(c => c.Name)
                : query.OrderBy(c => c.Name),
            "ordinal" => descending
                ? query.OrderByDescending(c => c.Ordinal)
                : query.OrderBy(c => c.Ordinal),
            "createdtime" => descending
                ? query.OrderByDescending(c => c.CreatedTime)
                : query.OrderBy(c => c.CreatedTime),
            _ => query
                .OrderBy(c => c.Type)
                .ThenBy(c => c.Ordinal)
                .ThenBy(c => c.Name)
        };
    }
}
