using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Notification;

namespace SPS.Application.Interfaces.IServices;

public interface INotificationService
{
    Task<Result<PagedResult<NotificationResponse>>> GetPagedAsync(NotificationQueryParameters parameters, CancellationToken cancellationToken = default);
    Task<Result<NotificationResponse>> GetByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<Result<NotificationResponse>> CreateAsync(CreateNotificationRequest request, CancellationToken cancellationToken = default);
    Task<Result<bool>> MarkAsReadAsync(long id, CancellationToken cancellationToken = default);
    Task<Result<bool>> DeleteAsync(long id, CancellationToken cancellationToken = default);
    Task<Result<List<NotificationResponse>>> GetByRecipientAsync(string recipient, CancellationToken cancellationToken = default);
    Task<Result<int>> GetUnreadCountAsync(string recipient, CancellationToken cancellationToken = default);
}