using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Notification;
using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IRepositories;

public interface INotificationRepository : IRepository<Notification, long>
{
    Task<PagedResult<Notification>> GetPagedAsync(NotificationQueryParameters parameters, CancellationToken cancellationToken = default);
    Task<List<Notification>> GetByRecipientAsync(string recipient, CancellationToken cancellationToken = default);
    Task<int> GetUnreadCountAsync(string recipient, CancellationToken cancellationToken = default);
}