using Microsoft.EntityFrameworkCore;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Picture;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Repositories.Common;

namespace SPS.Infrastructure.Repositories;

/// <summary>
/// 圖片倉儲實現
/// </summary>
public class PictureRepository : Repository<Picture, int>, IPictureRepository
{
    public PictureRepository(ApplicationDbContext context) : base(context)
    {
    }

    public override async Task<Picture?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.Album)
            .Include(p => p.MultilingualImage)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<Picture?> GetByIdWithIncludesAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.Album)
            .Include(p => p.MultilingualImage)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<PagedResult<Picture>> GetPagedAsync(
        PictureQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet
            .Include(p => p.Album)
            .Include(p => p.MultilingualImage)
            .AsQueryable();

        // 名稱模糊搜索
        if (!string.IsNullOrWhiteSpace(parameters.Name))
        {
            query = query.Where(p => p.Name != null && p.Name.Contains(parameters.Name));
        }

        // 相簿過濾
        if (parameters.AlbumId.HasValue)
        {
            query = query.Where(p => p.AlbumId == parameters.AlbumId.Value);
        }

        // 發布狀態過濾
        if (parameters.Published.HasValue)
        {
            query = query.Where(p => p.Published == parameters.Published.Value);
        }

        // 類型過濾
        if (parameters.Type.HasValue)
        {
            query = query.Where(p => p.Type == parameters.Type.Value);
        }

        // 一般搜索
        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            query = query.Where(p =>
                (p.Name != null && p.Name.Contains(parameters.Search)) ||
                (p.Remark != null && p.Remark.Contains(parameters.Search)));
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

        return new PagedResult<Picture>
        {
            Items = items,
            TotalCount = totalCount,
            Page = parameters.Page,
            PageSize = parameters.PageSize
        };
    }

    public async Task<List<Picture>> GetByAlbumIdAsync(int albumId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.Album)
            .Include(p => p.MultilingualImage)
            .Where(p => p.AlbumId == albumId)
            .OrderBy(p => p.Ordinal)
            .ThenBy(p => p.CreatedTime)
            .ToListAsync(cancellationToken);
    }

    private IQueryable<Picture> ApplySorting(
        IQueryable<Picture> query,
        string? sortBy,
        bool descending)
    {
        if (string.IsNullOrWhiteSpace(sortBy))
        {
            return descending
                ? query.OrderByDescending(p => p.CreatedTime)
                : query.OrderBy(p => p.CreatedTime);
        }

        return sortBy.ToLower() switch
        {
            "name" => descending
                ? query.OrderByDescending(p => p.Name)
                : query.OrderBy(p => p.Name),
            "ordinal" => descending
                ? query.OrderByDescending(p => p.Ordinal)
                : query.OrderBy(p => p.Ordinal),
            "createdtime" => descending
                ? query.OrderByDescending(p => p.CreatedTime)
                : query.OrderBy(p => p.CreatedTime),
            _ => descending
                ? query.OrderByDescending(p => p.CreatedTime)
                : query.OrderBy(p => p.CreatedTime)
        };
    }
}