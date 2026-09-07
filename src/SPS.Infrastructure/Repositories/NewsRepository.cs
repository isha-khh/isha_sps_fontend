using Microsoft.EntityFrameworkCore;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.News;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Domain.Enums;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Repositories.Common;

namespace SPS.Infrastructure.Repositories;

/// <summary>
/// 新聞倉儲實現
/// </summary>
public class NewsRepository : Repository<News, int>, INewsRepository
{
    public NewsRepository(ApplicationDbContext context) : base(context)
    {
    }

    public override async Task<News?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(n => n.Title)
            .Include(n => n.Introduction)
            .Include(n => n.Content)
            .Include(n => n.Category)
            .FirstOrDefaultAsync(n => n.Id == id, cancellationToken);
    }

    public async Task<News?> GetByIdWithIncludesAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(n => n.Title)
            .Include(n => n.Introduction)
            .Include(n => n.Content)
            .Include(n => n.Category)
            .Include(n => n.Picture)
            .FirstOrDefaultAsync(n => n.Id == id, cancellationToken);
    }

    public async Task<PagedResult<News>> GetPagedAsync(
        NewsQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet
            .Include(n => n.Title)
            .Include(n => n.Introduction)
            .Include(n => n.Category)
            .AsQueryable();

        // 搜索過濾
        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            query = query.Where(n =>
                (n.Title != null && n.Title.DefaultText != null && n.Title.DefaultText.Contains(parameters.Search)) ||
                (n.Introduction != null && n.Introduction.DefaultText != null && n.Introduction.DefaultText.Contains(parameters.Search)));
        }

        // 分類過濾
        if (parameters.CategoryId.HasValue)
        {
            query = query.Where(n => n.CategoryId == parameters.CategoryId.Value);
        }

        // 類型過濾
        if (parameters.Type.HasValue)
        {
            query = query.Where(n => n.Type == parameters.Type.Value);
        }

        // 發布狀態過濾
        if (parameters.Published.HasValue)
        {
            query = query.Where(n => n.Published == parameters.Published.Value);
        }

        // 標簽過濾
        if (parameters.TagId.HasValue)
        {
            var tagId = parameters.TagId.Value;
            var newsIdsWithTag = _context.Set<EntityTag>()
                .Where(et => et.TagId == tagId && et.EntityType == EntityType.News)
                .Select(et => int.Parse(et.EntityId))
                .ToList();

            query = query.Where(n => newsIdsWithTag.Contains(n.Id));
        }

        // 日期範圍過濾
        if (parameters.StartDateFrom.HasValue)
        {
            query = query.Where(n => n.StartDate >= parameters.StartDateFrom.Value);
        }

        if (parameters.StartDateTo.HasValue)
        {
            query = query.Where(n => n.StartDate <= parameters.StartDateTo.Value);
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

        return new PagedResult<News>
        {
            Items = items,
            TotalCount = totalCount,
            Page = parameters.Page,
            PageSize = parameters.PageSize
        };
    }

    public async Task<List<News>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(n => n.Title)
            .Include(n => n.Introduction)
            .Include(n => n.Category)
            .OrderByDescending(n => n.StartDate ?? n.CreatedTime)
            .ToListAsync(cancellationToken);
    }

    private IQueryable<News> ApplySorting(
        IQueryable<News> query,
        string? sortBy,
        bool descending)
    {
        if (string.IsNullOrWhiteSpace(sortBy))
        {
            return descending
                ? query.OrderByDescending(n => n.StartDate ?? n.CreatedTime)
                : query.OrderBy(n => n.StartDate ?? n.CreatedTime);
        }

        return sortBy.ToLower() switch
        {
            "startdate" => descending
                ? query.OrderByDescending(n => n.StartDate ?? n.CreatedTime)
                : query.OrderBy(n => n.StartDate ?? n.CreatedTime),
            "ordinal" => descending
                ? query.OrderByDescending(n => n.Ordinal)
                : query.OrderBy(n => n.Ordinal),
            "createdtime" => descending
                ? query.OrderByDescending(n => n.CreatedTime)
                : query.OrderBy(n => n.CreatedTime),
            _ => descending
                ? query.OrderByDescending(n => n.StartDate ?? n.CreatedTime)
                : query.OrderBy(n => n.StartDate ?? n.CreatedTime)
        };
    }

    public async Task<List<string>> GetNewsTagsAsync(int newsId, CancellationToken cancellationToken = default)
    {
        return await _context.Set<EntityTag>()
            .Where(et => et.EntityType == EntityType.News && et.EntityId == newsId.ToString())
            .Include(et => et.Tag)
            .Select(et => et.Tag.Name)
            .ToListAsync(cancellationToken);
    }
}
