using Microsoft.EntityFrameworkCore;
using SPS.Application.DTOs.Album;
using SPS.Application.DTOs.Common;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Repositories.Common;

namespace SPS.Infrastructure.Repositories;

/// <summary>
/// 相簿倉儲實現
/// </summary>
public class AlbumRepository : Repository<Album, int>, IAlbumRepository
{
    public AlbumRepository(ApplicationDbContext context) : base(context)
    {
    }

    public override async Task<Album?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(a => a.Cover)
            .Include(a => a.Pictures)
            .Include(a => a.Videos)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
    }

    public async Task<Album?> GetByIdWithIncludesAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(a => a.Cover)
            .Include(a => a.Pictures)
            .Include(a => a.Videos)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
    }

    public async Task<PagedResult<Album>> GetPagedAsync(
        AlbumQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet
            .Include(a => a.Cover)
            .Include(a => a.Pictures)
            .Include(a => a.Videos)
            .AsQueryable();

        // 標題模糊搜索
        if (!string.IsNullOrWhiteSpace(parameters.Title))
        {
            query = query.Where(a => a.Title != null && a.Title.Contains(parameters.Title));
        }

        // 發布狀態過濾
        if (parameters.Published.HasValue)
        {
            query = query.Where(a => a.Published == parameters.Published.Value);
        }

        // 開始日期範圍過濾
        if (parameters.StartDateFrom.HasValue)
        {
            query = query.Where(a => a.StartDate >= parameters.StartDateFrom.Value);
        }

        if (parameters.StartDateTo.HasValue)
        {
            query = query.Where(a => a.StartDate <= parameters.StartDateTo.Value);
        }

        // 一般搜索
        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            query = query.Where(a =>
                (a.Title != null && a.Title.Contains(parameters.Search)) ||
                (a.Number != null && a.Number.Contains(parameters.Search)));
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

        return new PagedResult<Album>
        {
            Items = items,
            TotalCount = totalCount,
            Page = parameters.Page,
            PageSize = parameters.PageSize
        };
    }

    private IQueryable<Album> ApplySorting(
        IQueryable<Album> query,
        string? sortBy,
        bool descending)
    {
        if (string.IsNullOrWhiteSpace(sortBy))
        {
            return descending
                ? query.OrderByDescending(a => a.StartDate ?? a.CreatedTime)
                : query.OrderBy(a => a.StartDate ?? a.CreatedTime);
        }

        return sortBy.ToLower() switch
        {
            "title" => descending
                ? query.OrderByDescending(a => a.Title)
                : query.OrderBy(a => a.Title),
            "startdate" => descending
                ? query.OrderByDescending(a => a.StartDate ?? a.CreatedTime)
                : query.OrderBy(a => a.StartDate ?? a.CreatedTime),
            "ordinal" => descending
                ? query.OrderByDescending(a => a.Ordinal)
                : query.OrderBy(a => a.Ordinal),
            "createdtime" => descending
                ? query.OrderByDescending(a => a.CreatedTime)
                : query.OrderBy(a => a.CreatedTime),
            _ => descending
                ? query.OrderByDescending(a => a.StartDate ?? a.CreatedTime)
                : query.OrderBy(a => a.StartDate ?? a.CreatedTime)
        };
    }
}