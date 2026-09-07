using Microsoft.EntityFrameworkCore;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Regulations;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Repositories.Common;

namespace SPS.Infrastructure.Repositories;

/// <summary>
/// 法規倉儲實現
/// </summary>
public class RegulationsRepository : Repository<Regulations, int>, IRegulationsRepository
{
    public RegulationsRepository(ApplicationDbContext context) : base(context)
    {
    }

    public override async Task<Regulations?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(r => r.Category)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task<PagedResult<Regulations>> GetPagedAsync(
        RegulationsQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet
            .Include(r => r.Category)
            .AsQueryable();

        // 搜索過濾
        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            query = query.Where(r =>
                (r.Name != null && r.Name.Contains(parameters.Search)) ||
                (r.Title != null && r.Title.Contains(parameters.Search)) ||
                (r.Content != null && r.Content.Contains(parameters.Search)));
        }

        // 類型過濾
        if (parameters.Type.HasValue)
        {
            query = query.Where(r => r.Type == parameters.Type.Value);
        }

        // 分類過濾
        if (parameters.CategoryId.HasValue)
        {
            query = query.Where(r => r.CategoryId == parameters.CategoryId.Value);
        }

        // 發布狀態過濾
        if (parameters.Published.HasValue)
        {
            query = query.Where(r => r.Published == parameters.Published.Value);
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

        return new PagedResult<Regulations>
        {
            Items = items,
            TotalCount = totalCount,
            Page = parameters.Page,
            PageSize = parameters.PageSize
        };
    }

    public async Task<List<Regulations>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(r => r.Category)
            .OrderBy(r => r.Ordinal)
            .ThenBy(r => r.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Regulations>> GetByTypeAsync(
        short type,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(r => r.Category)
            .Where(r => r.Type == type)
            .OrderBy(r => r.Ordinal)
            .ThenBy(r => r.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Regulations>> GetByCategoryAsync(
        int categoryId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(r => r.Category)
            .Where(r => r.CategoryId == categoryId)
            .OrderBy(r => r.Ordinal)
            .ThenBy(r => r.Name)
            .ToListAsync(cancellationToken);
    }

    private IQueryable<Regulations> ApplySorting(
        IQueryable<Regulations> query,
        string? sortBy,
        bool descending)
    {
        if (string.IsNullOrWhiteSpace(sortBy))
        {
            return query
                .OrderBy(r => r.Ordinal)
                .ThenBy(r => r.Name);
        }

        return sortBy.ToLower() switch
        {
            "name" => descending
                ? query.OrderByDescending(r => r.Name)
                : query.OrderBy(r => r.Name),
            "ordinal" => descending
                ? query.OrderByDescending(r => r.Ordinal)
                : query.OrderBy(r => r.Ordinal),
            "createdtime" => descending
                ? query.OrderByDescending(r => r.CreatedTime)
                : query.OrderBy(r => r.CreatedTime),
            _ => query
                .OrderBy(r => r.Ordinal)
                .ThenBy(r => r.Name)
        };
    }
}
