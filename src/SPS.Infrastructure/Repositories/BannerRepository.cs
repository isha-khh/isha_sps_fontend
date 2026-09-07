using Microsoft.EntityFrameworkCore;
using SPS.Application.DTOs.Banner;
using SPS.Application.DTOs.Common;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Repositories.Common;

namespace SPS.Infrastructure.Repositories;

/// <summary>
/// Banner 倉儲實現
/// </summary>
public class BannerRepository : Repository<Banner, long>, IBannerRepository
{
    public BannerRepository(ApplicationDbContext context) : base(context)
    {
    }

    public override async Task<Banner?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(b => b.Position)
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
    }

    public async Task<Banner?> GetByIdWithIncludesAsync(long id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(b => b.Position)
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
    }

    public async Task<PagedResult<Banner>> GetPagedAsync(
        BannerQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet
            .Include(b => b.Position)
            .AsQueryable();

        // 名稱模糊搜索
        if (!string.IsNullOrWhiteSpace(parameters.Name))
        {
            query = query.Where(b => b.Name != null && b.Name.Contains(parameters.Name));
        }

        // 位置過濾
        if (parameters.PositionId.HasValue)
        {
            query = query.Where(b => b.PositionId == parameters.PositionId.Value);
        }

        // 一般搜索
        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            query = query.Where(b =>
                (b.Name != null && b.Name.Contains(parameters.Search)) ||
                (b.Remark != null && b.Remark.Contains(parameters.Search)));
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

        return new PagedResult<Banner>
        {
            Items = items,
            TotalCount = totalCount,
            Page = parameters.Page,
            PageSize = parameters.PageSize
        };
    }

    public async Task<List<Banner>> GetByPositionIdAsync(int positionId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(b => b.Position)
            .Where(b => b.PositionId == positionId)
            .OrderBy(b => b.CreatedTime)
            .ToListAsync(cancellationToken);
    }

    private IQueryable<Banner> ApplySorting(
        IQueryable<Banner> query,
        string? sortBy,
        bool descending)
    {
        if (string.IsNullOrWhiteSpace(sortBy))
        {
            return descending
                ? query.OrderByDescending(b => b.CreatedTime)
                : query.OrderBy(b => b.CreatedTime);
        }

        return sortBy.ToLower() switch
        {
            "name" => descending
                ? query.OrderByDescending(b => b.Name)
                : query.OrderBy(b => b.Name),
            "viewcount" => descending
                ? query.OrderByDescending(b => b.ViewCount)
                : query.OrderBy(b => b.ViewCount),
            "clickcount" => descending
                ? query.OrderByDescending(b => b.ClickCount)
                : query.OrderBy(b => b.ClickCount),
            "createdtime" => descending
                ? query.OrderByDescending(b => b.CreatedTime)
                : query.OrderBy(b => b.CreatedTime),
            _ => descending
                ? query.OrderByDescending(b => b.CreatedTime)
                : query.OrderBy(b => b.CreatedTime)
        };
    }
}