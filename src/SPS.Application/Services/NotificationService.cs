using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Notification;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;

namespace SPS.Application.Services;

public class NotificationService : INotificationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMemoryCache _cache;
    private readonly ILogger<NotificationService> _logger;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromSeconds(30);

    public NotificationService(IUnitOfWork unitOfWork, IMemoryCache cache, ILogger<NotificationService> logger)
    {
        _unitOfWork = unitOfWork;
        _cache = cache;
        _logger = logger;
    }

    private static string GetRecipientCacheKey(string recipient) => $"notifications:recipient:{recipient}";
    private static string GetUnreadCountCacheKey(string recipient) => $"notifications:unreadCount:{recipient}";

    private void InvalidateRecipientCache(string? recipient)
    {
        if (string.IsNullOrEmpty(recipient)) return;
        _cache.Remove(GetRecipientCacheKey(recipient));
        _cache.Remove(GetUnreadCountCacheKey(recipient));
    }

    public async Task<Result<PagedResult<NotificationResponse>>> GetPagedAsync(NotificationQueryParameters parameters, CancellationToken cancellationToken = default)
    {
        var pagedResult = await _unitOfWork.Notifications.GetPagedAsync(parameters, cancellationToken);
        var response = new PagedResult<NotificationResponse>
        {
            Items = pagedResult.Items.Select(MapToResponse).ToList(),
            TotalCount = pagedResult.TotalCount,
            Page = pagedResult.Page,
            PageSize = pagedResult.PageSize
        };
        return Result<PagedResult<NotificationResponse>>.Success(response);
    }

    public async Task<Result<NotificationResponse>> GetByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        var notification = await _unitOfWork.Notifications.GetByIdAsync(id, cancellationToken);
        if (notification == null)
            return Result<NotificationResponse>.Failure("通知不存在");

        return Result<NotificationResponse>.Success(MapToResponse(notification));
    }

    public async Task<Result<NotificationResponse>> CreateAsync(CreateNotificationRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            var notification = new Notification
            {
                Type = request.Type,
                Category = request.Category,
                Title = request.Title,
                Content = request.Content,
                SendId = request.SendId,
                Recipient = request.Recipient,
                Read = false,
                Expiration = request.Expiration,
                CreatedTime = DateTime.UtcNow,
                UpdatedTime = DateTime.UtcNow
            };

            await _unitOfWork.Notifications.AddAsync(notification, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // 清除該收件人的快取
            InvalidateRecipientCache(request.Recipient);

            return Result<NotificationResponse>.Success(MapToResponse(notification));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "創建通知時發生錯誤: {Message}", ex.Message);
            return Result<NotificationResponse>.Failure($"創建通知失敗: {ex.Message}");
        }
    }

    public async Task<Result<bool>> MarkAsReadAsync(long id, CancellationToken cancellationToken = default)
    {
        var notification = await _unitOfWork.Notifications.GetByIdAsync(id, cancellationToken);
        if (notification == null)
            return Result<bool>.Failure("通知不存在");

        notification.Read = true;
        notification.UpdatedTime = DateTime.UtcNow;

        await _unitOfWork.Notifications.UpdateAsync(notification, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 清除該收件人的快取
        InvalidateRecipientCache(notification.Recipient);

        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> DeleteAsync(long id, CancellationToken cancellationToken = default)
    {
        var notification = await _unitOfWork.Notifications.GetByIdAsync(id, cancellationToken);
        if (notification == null)
            return Result<bool>.Failure("通知不存在");

        var recipient = notification.Recipient;

        await _unitOfWork.Notifications.DeleteAsync(notification, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 清除該收件人的快取
        InvalidateRecipientCache(recipient);

        return Result<bool>.Success(true);
    }

    public async Task<Result<List<NotificationResponse>>> GetByRecipientAsync(string recipient, CancellationToken cancellationToken = default)
    {
        var cacheKey = GetRecipientCacheKey(recipient);

        if (_cache.TryGetValue(cacheKey, out List<NotificationResponse>? cachedResponse) && cachedResponse != null)
        {
            return Result<List<NotificationResponse>>.Success(cachedResponse);
        }

        var notifications = await _unitOfWork.Notifications.GetByRecipientAsync(recipient, cancellationToken);
        var response = notifications.Select(MapToResponse).ToList();

        _cache.Set(cacheKey, response, CacheDuration);

        return Result<List<NotificationResponse>>.Success(response);
    }

    public async Task<Result<int>> GetUnreadCountAsync(string recipient, CancellationToken cancellationToken = default)
    {
        var cacheKey = GetUnreadCountCacheKey(recipient);

        if (_cache.TryGetValue(cacheKey, out int cachedCount))
        {
            return Result<int>.Success(cachedCount);
        }

        var count = await _unitOfWork.Notifications.GetUnreadCountAsync(recipient, cancellationToken);

        _cache.Set(cacheKey, count, CacheDuration);

        return Result<int>.Success(count);
    }

    private NotificationResponse MapToResponse(Notification notification)
    {
        return new NotificationResponse
        {
            Id = notification.Id,
            Type = notification.Type,
            Category = notification.Category,
            Title = notification.Title,
            Content = notification.Content,
            SendId = notification.SendId,
            Recipient = notification.Recipient,
            Read = notification.Read,
            Expiration = notification.Expiration,
            CreatedTime = notification.CreatedTime,
            UpdatedTime = notification.UpdatedTime
        };
    }
}