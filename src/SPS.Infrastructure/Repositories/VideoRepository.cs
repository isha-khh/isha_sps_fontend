using Microsoft.EntityFrameworkCore;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Video;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Repositories.Common;

namespace SPS.Infrastructure.Repositories;

/// <summary>
/// 影片倉儲實現
/// </summary>
public class VideoRepository : Repository<Video, int>, IVideoRepository
{
    public VideoRepository(ApplicationDbContext context) : base(context)
    {
    }

    public override async Task<Video?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(v => v.Album)
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);
    }

    public async Task<Video?> GetByIdWithIncludesAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(v => v.Album)
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);
    }

    public async Task<PagedResult<Video>> GetPagedAsync(
        VideoQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet
            .Include(v => v.Album)
            .AsQueryable();

        // 名稱模糊搜索
        if (!string.IsNullOrWhiteSpace(parameters.Name))
        {
            query = query.Where(v => v.Name != null && v.Name.Contains(parameters.Name));
        }

        // 相簿過濾
        if (parameters.AlbumId.HasValue)
        {
            query = query.Where(v => v.AlbumId == parameters.AlbumId.Value);
        }

        // 發布狀態過濾
        if (parameters.Published.HasValue)
        {
            query = query.Where(v => v.Published == parameters.Published.Value);
        }

        // 一般搜索
        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            query = query.Where(v =>
                (v.Name != null && v.Name.Contains(parameters.Search)) ||
                (v.Remark != null && v.Remark.Contains(parameters.Search)));
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

        return new PagedResult<Video>
        {
            Items = items,
            TotalCount = totalCount,
            Page = parameters.Page,
            PageSize = parameters.PageSize
        };
    }

    public async Task<List<Video>> GetByAlbumIdAsync(int albumId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(v => v.Album)
            .Where(v => v.AlbumId == albumId)
            .OrderBy(v => v.Ordinal)
            .ThenBy(v => v.CreatedTime)
            .ToListAsync(cancellationToken);
    }

    private IQueryable<Video> ApplySorting(
        IQueryable<Video> query,
        string? sortBy,
        bool descending)
    {
        if (string.IsNullOrWhiteSpace(sortBy))
        {
            return descending
                ? query.OrderByDescending(v => v.CreatedTime)
                : query.OrderBy(v => v.CreatedTime);
        }

        return sortBy.ToLower() switch
        {
            "name" => descending
                ? query.OrderByDescending(v => v.Name)
                : query.OrderBy(v => v.Name),
            "ordinal" => descending
                ? query.OrderByDescending(v => v.Ordinal)
                : query.OrderBy(v => v.Ordinal),
            "createdtime" => descending
                ? query.OrderByDescending(v => v.CreatedTime)
                : query.OrderBy(v => v.CreatedTime),
            _ => descending
                ? query.OrderByDescending(v => v.CreatedTime)
                : query.OrderBy(v => v.CreatedTime)
        };
    }
}