using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Video;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;

namespace SPS.Application.Services;

public class VideoService : IVideoService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<VideoService> _logger;

    public VideoService(IUnitOfWork unitOfWork, ILogger<VideoService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<PagedResult<VideoListItemResponse>>> GetPagedAsync(
        VideoQueryParameters parameters, CancellationToken cancellationToken = default)
    {
        var pagedResult = await _unitOfWork.Videos.GetPagedAsync(parameters, cancellationToken);
        var response = new PagedResult<VideoListItemResponse>
        {
            Items = pagedResult.Items.Select(v => new VideoListItemResponse
            {
                Id = v.Id,
                Name = v.Name,
                Uri = v.Uri,
                ThumbnailUri = v.ThumbnailUri,
                Published = v.Published,
                AlbumId = v.AlbumId,
                AlbumTitle = v.Album?.Title,
                CreatedTime = v.CreatedTime
            }).ToList(),
            TotalCount = pagedResult.TotalCount,
            Page = pagedResult.Page,
            PageSize = pagedResult.PageSize
        };
        return Result<PagedResult<VideoListItemResponse>>.Success(response);
    }

    public async Task<Result<VideoResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var video = await _unitOfWork.Videos.GetByIdWithIncludesAsync(id, cancellationToken);
        if (video == null)
            return Result<VideoResponse>.Failure("影片不存在");

        return Result<VideoResponse>.Success(MapToResponse(video));
    }

    public async Task<Result<VideoResponse>> CreateAsync(
        CreateVideoRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            var video = new Video
            {
                Name = request.Name,
                ContentType = request.ContentType,
                Uri = request.Uri,
                ThumbnailUri = request.ThumbnailUri,
                LinkUrl = request.LinkUrl,
                Published = request.Published,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                Ordinal = request.Ordinal,
                Height = request.Height,
                Width = request.Width,
                Dpi = request.Dpi,
                Remark = request.Remark,
                AlbumId = request.AlbumId,
                CreatedTime = DateTime.UtcNow,
                UpdatedTime = DateTime.UtcNow
            };

            await _unitOfWork.Videos.AddAsync(video, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var createdVideo = await _unitOfWork.Videos.GetByIdWithIncludesAsync(video.Id, cancellationToken);
            return Result<VideoResponse>.Success(MapToResponse(createdVideo!));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "創建影片時發生錯誤: {Message}", ex.Message);
            return Result<VideoResponse>.Failure($"創建影片失敗: {ex.Message}");
        }
    }

    public async Task<Result<VideoResponse>> UpdateAsync(
        int id, UpdateVideoRequest request, CancellationToken cancellationToken = default)
    {
        var video = await _unitOfWork.Videos.GetByIdAsync(id, cancellationToken);
        if (video == null)
            return Result<VideoResponse>.Failure("影片不存在");

        if (!string.IsNullOrEmpty(request.Name)) video.Name = request.Name;
        if (request.ContentType != null) video.ContentType = request.ContentType;
        if (!string.IsNullOrEmpty(request.Uri)) video.Uri = request.Uri;
        if (request.ThumbnailUri != null) video.ThumbnailUri = request.ThumbnailUri;
        if (request.LinkUrl != null) video.LinkUrl = request.LinkUrl;
        if (request.Published.HasValue) video.Published = request.Published.Value;
        if (request.StartDate.HasValue) video.StartDate = request.StartDate;
        if (request.EndDate.HasValue) video.EndDate = request.EndDate;
        if (request.Ordinal.HasValue) video.Ordinal = request.Ordinal.Value;
        if (request.Height.HasValue) video.Height = request.Height.Value;
        if (request.Width.HasValue) video.Width = request.Width.Value;
        if (request.Dpi.HasValue) video.Dpi = request.Dpi.Value;
        if (request.Remark != null) video.Remark = request.Remark;
        if (request.AlbumId.HasValue) video.AlbumId = request.AlbumId;
        video.UpdatedTime = DateTime.UtcNow;

        await _unitOfWork.Videos.UpdateAsync(video, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updatedVideo = await _unitOfWork.Videos.GetByIdWithIncludesAsync(id, cancellationToken);
        return Result<VideoResponse>.Success(MapToResponse(updatedVideo!));
    }

    public async Task<Result<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var video = await _unitOfWork.Videos.GetByIdAsync(id, cancellationToken);
        if (video == null)
            return Result<bool>.Failure("影片不存在");

        await _unitOfWork.Videos.DeleteAsync(video, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }

    public async Task<Result<List<VideoResponse>>> GetByAlbumIdAsync(
        int albumId, CancellationToken cancellationToken = default)
    {
        var videos = await _unitOfWork.Videos.GetByAlbumIdAsync(albumId, cancellationToken);
        var response = videos.Select(MapToResponse).ToList();
        return Result<List<VideoResponse>>.Success(response);
    }

    private VideoResponse MapToResponse(Video video)
    {
        return new VideoResponse
        {
            Id = video.Id,
            Name = video.Name,
            ContentType = video.ContentType,
            Uri = video.Uri,
            ThumbnailUri = video.ThumbnailUri,
            LinkUrl = video.LinkUrl,
            Published = video.Published,
            StartDate = video.StartDate,
            EndDate = video.EndDate,
            Ordinal = video.Ordinal,
            Height = video.Height,
            Width = video.Width,
            Dpi = video.Dpi,
            Remark = video.Remark,
            AlbumId = video.AlbumId,
            AlbumTitle = video.Album?.Title,
            CreatedTime = video.CreatedTime,
            UpdatedTime = video.UpdatedTime
        };
    }
}