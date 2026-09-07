using Microsoft.EntityFrameworkCore;
using SPS.Application.DTOs.About;
using SPS.Application.DTOs.Common;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Repositories.Common;

namespace SPS.Infrastructure.Repositories;

/// <summary>
/// 關於我們倉儲實現
/// </summary>
public class AboutRepository : Repository<About, int>, IAboutRepository
{
    public AboutRepository(ApplicationDbContext context) : base(context)
    {
    }

    public override async Task<About?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(a => a.Title)
            .Include(a => a.Content)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
    }

    public async Task<PagedResult<About>> GetPagedAsync(
        AboutQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet
            .Include(a => a.Title)
            .Include(a => a.Content)
            .AsQueryable();

        // 搜索過濾
        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            query = query.Where(a =>
                (a.Name != null && a.Name.Contains(parameters.Search)) ||
                (a.Title != null && a.Title.DefaultText != null && a.Title.DefaultText.Contains(parameters.Search)));
        }

        // 類型過濾
        if (parameters.Type.HasValue)
        {
            query = query.Where(a => a.Type == parameters.Type.Value);
        }

        // 發布狀態過濾
        if (parameters.Published.HasValue)
        {
            query = query.Where(a => a.Published == parameters.Published.Value);
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

        return new PagedResult<About>
        {
            Items = items,
            TotalCount = totalCount,
            Page = parameters.Page,
            PageSize = parameters.PageSize
        };
    }

    public async Task<List<About>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(a => a.Title)
            .Include(a => a.Content)
            .OrderBy(a => a.Ordinal)
            .ThenBy(a => a.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<About>> GetByTypeAsync(
        short type,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(a => a.Title)
            .Include(a => a.Content)
            .Where(a => a.Type == type)
            .OrderBy(a => a.Ordinal)
            .ThenBy(a => a.Name)
            .ToListAsync(cancellationToken);
    }

    private IQueryable<About> ApplySorting(
        IQueryable<About> query,
        string? sortBy,
        bool descending)
    {
        if (string.IsNullOrWhiteSpace(sortBy))
        {
            return query
                .OrderBy(a => a.Ordinal)
                .ThenBy(a => a.Name);
        }

        return sortBy.ToLower() switch
        {
            "name" => descending
                ? query.OrderByDescending(a => a.Name)
                : query.OrderBy(a => a.Name),
            "ordinal" => descending
                ? query.OrderByDescending(a => a.Ordinal)
                : query.OrderBy(a => a.Ordinal),
            "sendtime" => descending
                ? query.OrderByDescending(a => a.SendTime)
                : query.OrderBy(a => a.SendTime),
            "createdtime" => descending
                ? query.OrderByDescending(a => a.CreatedTime)
                : query.OrderBy(a => a.CreatedTime),
            _ => query
                .OrderBy(a => a.Ordinal)
                .ThenBy(a => a.Name)
        };
    }
}
