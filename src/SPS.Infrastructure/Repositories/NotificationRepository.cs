using Microsoft.EntityFrameworkCore;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Notification;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Repositories.Common;

namespace SPS.Infrastructure.Repositories;

public class NotificationRepository : Repository<Notification, long>, INotificationRepository
{
    public NotificationRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<PagedResult<Notification>> GetPagedAsync(NotificationQueryParameters parameters, CancellationToken cancellationToken = default)
    {
        var query = _dbSet.AsQueryable();

        if (parameters.Type.HasValue)
            query = query.Where(n => n.Type == parameters.Type.Value);

        if (!string.IsNullOrWhiteSpace(parameters.Recipient))
            query = query.Where(n => n.Recipient == parameters.Recipient);

        if (parameters.Read.HasValue)
            query = query.Where(n => n.Read == parameters.Read.Value);

        if (!string.IsNullOrWhiteSpace(parameters.Search))
            query = query.Where(n => n.Title != null && n.Title.Contains(parameters.Search) ||
                                     n.Content != null && n.Content.Contains(parameters.Search));

        var totalCount = await query.CountAsync(cancellationToken);

        query = parameters.Descending
            ? query.OrderByDescending(n => n.CreatedTime)
            : query.OrderBy(n => n.CreatedTime);

        var items = await query
            .Skip((parameters.Page - 1) * parameters.PageSize)
            .Take(parameters.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Notification>
        {
            Items = items,
            TotalCount = totalCount,
            Page = parameters.Page,
            PageSize = parameters.PageSize
        };
    }

    public async Task<List<Notification>> GetByRecipientAsync(string recipient, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(n => n.Recipient == recipient)
            .OrderByDescending(n => n.CreatedTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetUnreadCountAsync(string recipient, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(n => n.Recipient == recipient && !n.Read)
            .CountAsync(cancellationToken);
    }
}