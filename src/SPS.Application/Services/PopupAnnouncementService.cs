using System.Text.Json;
using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.PopupAnnouncement;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;

namespace SPS.Application.Services;

/// <summary>
/// 彈窗公告服務實現
/// </summary>
public class PopupAnnouncementService : IPopupAnnouncementService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<PopupAnnouncementService> _logger;

    public PopupAnnouncementService(
        IUnitOfWork unitOfWork,
        ILogger<PopupAnnouncementService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<PagedResult<PopupAnnouncementListItemResponse>>> GetPagedAsync(
        PopupAnnouncementQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        var pagedResult = await _unitOfWork.PopupAnnouncements.GetPagedAsync(parameters, cancellationToken);

        var response = new PagedResult<PopupAnnouncementListItemResponse>
        {
            Items = pagedResult.Items.Select(MapToListItem).ToList(),
            TotalCount = pagedResult.TotalCount,
            Page = pagedResult.Page,
            PageSize = pagedResult.PageSize
        };

        return Result<PagedResult<PopupAnnouncementListItemResponse>>.Success(response);
    }

    public async Task<Result<PopupAnnouncementResponse>> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var entity = await _unitOfWork.PopupAnnouncements.GetByIdAsync(id, cancellationToken);
        if (entity == null)
        {
            return Result<PopupAnnouncementResponse>.Failure("彈窗公告不存在");
        }

        return Result<PopupAnnouncementResponse>.Success(MapToResponse(entity));
    }

    public async Task<Result<PopupAnnouncementResponse>> CreateAsync(
        CreatePopupAnnouncementRequest request,
        CancellationToken cancellationToken = default)
    {
        var entity = new PopupAnnouncement
        {
            Title = request.Title,
            Content = request.Content,
            ImageId = request.ImageId,
            LinkUrl = request.LinkUrl,
            LinkTarget = request.LinkTarget ?? "_self",
            Routes = JsonSerializer.Serialize(request.Routes),
            Frequency = request.Frequency,
            Priority = request.Priority,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            ShowCloseButton = request.ShowCloseButton,
            ShowDontShowToday = request.ShowDontShowToday,
            Published = request.Published,
            Ordinal = request.Ordinal,
            CreatedTime = DateTime.UtcNow,
            UpdatedTime = DateTime.UtcNow
        };

        await _unitOfWork.PopupAnnouncements.AddAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created popup announcement {Id}", entity.Id);

        // Reload to get navigation properties
        var created = await _unitOfWork.PopupAnnouncements.GetByIdAsync(entity.Id, cancellationToken);
        return Result<PopupAnnouncementResponse>.Success(MapToResponse(created!));
    }

    public async Task<Result<PopupAnnouncementResponse>> UpdateAsync(
        int id,
        UpdatePopupAnnouncementRequest request,
        CancellationToken cancellationToken = default)
    {
        var entity = await _unitOfWork.PopupAnnouncements.GetByIdAsync(id, cancellationToken);
        if (entity == null)
        {
            return Result<PopupAnnouncementResponse>.Failure("彈窗公告不存在");
        }

        if (request.Title != null) entity.Title = request.Title;
        if (request.Content != null) entity.Content = request.Content;
        if (request.ImageId.HasValue) entity.ImageId = request.ImageId;
        if (request.LinkUrl != null) entity.LinkUrl = request.LinkUrl;
        if (request.LinkTarget != null) entity.LinkTarget = request.LinkTarget;
        if (request.Routes != null) entity.Routes = JsonSerializer.Serialize(request.Routes);
        if (request.Frequency.HasValue) entity.Frequency = request.Frequency.Value;
        if (request.Priority.HasValue) entity.Priority = request.Priority.Value;
        if (request.StartDate.HasValue) entity.StartDate = request.StartDate;
        if (request.EndDate.HasValue) entity.EndDate = request.EndDate;
        if (request.ShowCloseButton.HasValue) entity.ShowCloseButton = request.ShowCloseButton.Value;
        if (request.ShowDontShowToday.HasValue) entity.ShowDontShowToday = request.ShowDontShowToday.Value;
        if (request.Published.HasValue) entity.Published = request.Published.Value;
        if (request.Ordinal.HasValue) entity.Ordinal = request.Ordinal.Value;

        entity.UpdatedTime = DateTime.UtcNow;

        await _unitOfWork.PopupAnnouncements.UpdateAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Updated popup announcement {Id}", id);

        // Reload to get navigation properties
        var updated = await _unitOfWork.PopupAnnouncements.GetByIdAsync(id, cancellationToken);
        return Result<PopupAnnouncementResponse>.Success(MapToResponse(updated!));
    }

    public async Task<Result<bool>> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var entity = await _unitOfWork.PopupAnnouncements.GetByIdAsync(id, cancellationToken);
        if (entity == null)
        {
            return Result<bool>.Failure("彈窗公告不存在");
        }

        await _unitOfWork.PopupAnnouncements.DeleteAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Deleted popup announcement {Id}", id);

        return Result<bool>.Success(true);
    }

    public async Task<Result<List<PopupAnnouncementResponse>>> GetActiveByRouteAsync(
        string route,
        CancellationToken cancellationToken = default)
    {
        var entities = await _unitOfWork.PopupAnnouncements.GetActiveByRouteAsync(route, cancellationToken);
        var response = entities.Select(MapToResponse).ToList();
        return Result<List<PopupAnnouncementResponse>>.Success(response);
    }

    private static PopupAnnouncementResponse MapToResponse(PopupAnnouncement entity)
    {
        return new PopupAnnouncementResponse
        {
            Id = entity.Id,
            Title = entity.Title,
            Content = entity.Content,
            ImageId = entity.ImageId,
            ImageUrl = entity.Image?.Uri,
            LinkUrl = entity.LinkUrl,
            LinkTarget = entity.LinkTarget,
            Routes = ParseRoutes(entity.Routes),
            Frequency = entity.Frequency,
            Priority = entity.Priority,
            StartDate = entity.StartDate,
            EndDate = entity.EndDate,
            ShowCloseButton = entity.ShowCloseButton,
            ShowDontShowToday = entity.ShowDontShowToday,
            Published = entity.Published,
            Ordinal = entity.Ordinal,
            CreatedTime = entity.CreatedTime,
            UpdatedTime = entity.UpdatedTime
        };
    }

    private static PopupAnnouncementListItemResponse MapToListItem(PopupAnnouncement entity)
    {
        return new PopupAnnouncementListItemResponse
        {
            Id = entity.Id,
            Title = entity.Title,
            Routes = ParseRoutes(entity.Routes),
            Frequency = entity.Frequency,
            Priority = entity.Priority,
            StartDate = entity.StartDate,
            EndDate = entity.EndDate,
            Published = entity.Published,
            CreatedTime = entity.CreatedTime
        };
    }

    private static List<string> ParseRoutes(string routesJson)
    {
        try
        {
            return JsonSerializer.Deserialize<List<string>>(routesJson) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }
}
