using Microsoft.EntityFrameworkCore;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.PopupAnnouncement;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Repositories.Common;

namespace SPS.Infrastructure.Repositories;

/// <summary>
/// 彈窗公告倉儲實現
/// </summary>
public class PopupAnnouncementRepository : Repository<PopupAnnouncement, int>, IPopupAnnouncementRepository
{
    public PopupAnnouncementRepository(ApplicationDbContext context) : base(context)
    {
    }

    public override async Task<PopupAnnouncement?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.Image)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<PagedResult<PopupAnnouncement>> GetPagedAsync(
        PopupAnnouncementQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet.Include(p => p.Image).AsQueryable();

        // 發布狀態過濾
        if (parameters.Published.HasValue)
        {
            query = query.Where(p => p.Published == parameters.Published.Value);
        }

        // 路由過濾
        if (!string.IsNullOrWhiteSpace(parameters.Route))
        {
            query = query.Where(p => p.Routes.Contains(parameters.Route));
        }

        // 搜尋
        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            query = query.Where(p => p.Title.Contains(parameters.Search));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        // 排序
        query = query.OrderBy(p => p.Priority).ThenByDescending(p => p.CreatedTime);

        // 分頁
        var items = await query
            .Skip((parameters.Page - 1) * parameters.PageSize)
            .Take(parameters.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<PopupAnnouncement>
        {
            Items = items,
            TotalCount = totalCount,
            Page = parameters.Page,
            PageSize = parameters.PageSize
        };
    }

    public async Task<List<PopupAnnouncement>> GetActiveByRouteAsync(
        string route,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        return await _dbSet
            .Include(p => p.Image)
            .Where(p => p.Published)
            .Where(p => p.Routes.Contains($"\"{route}\"")) // JSON array 包含該路由
            .Where(p => !p.StartDate.HasValue || p.StartDate <= now)
            .Where(p => !p.EndDate.HasValue || p.EndDate >= now)
            .OrderBy(p => p.Priority)
            .ThenBy(p => p.Ordinal)
            .ToListAsync(cancellationToken);
    }
}
