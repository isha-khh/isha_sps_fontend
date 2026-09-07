using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Picture;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;

namespace SPS.Application.Services;

public class PictureService : IPictureService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<PictureService> _logger;

    public PictureService(IUnitOfWork unitOfWork, ILogger<PictureService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<PagedResult<PictureListItemResponse>>> GetPagedAsync(
        PictureQueryParameters parameters, CancellationToken cancellationToken = default)
    {
        var pagedResult = await _unitOfWork.Pictures.GetPagedAsync(parameters, cancellationToken);
        var response = new PagedResult<PictureListItemResponse>
        {
            Items = pagedResult.Items.Select(p => new PictureListItemResponse
            {
                Id = p.Id,
                Name = p.Name,
                Uri = p.Uri,
                ThumbnailUri = p.ThumbnailUri,
                Published = p.Published,
                AlbumId = p.AlbumId,
                AlbumTitle = p.Album?.Title,
                CreatedTime = p.CreatedTime
            }).ToList(),
            TotalCount = pagedResult.TotalCount,
            Page = pagedResult.Page,
            PageSize = pagedResult.PageSize
        };
        return Result<PagedResult<PictureListItemResponse>>.Success(response);
    }

    public async Task<Result<PictureResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var picture = await _unitOfWork.Pictures.GetByIdWithIncludesAsync(id, cancellationToken);
        if (picture == null)
            return Result<PictureResponse>.Failure("圖片不存在");

        return Result<PictureResponse>.Success(MapToResponse(picture));
    }

    public async Task<Result<PictureResponse>> CreateAsync(
        CreatePictureRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            var picture = new Picture
            {
                Name = request.Name,
                Culture = request.Culture,
                Type = request.Type,
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
                MultilingualImageId = request.MultilingualImageId,
                CreatedTime = DateTime.UtcNow,
                UpdatedTime = DateTime.UtcNow
            };

            await _unitOfWork.Pictures.AddAsync(picture, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var createdPicture = await _unitOfWork.Pictures.GetByIdWithIncludesAsync(picture.Id, cancellationToken);
            return Result<PictureResponse>.Success(MapToResponse(createdPicture!));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "創建圖片時發生錯誤: {Message}", ex.Message);
            return Result<PictureResponse>.Failure($"創建圖片失敗: {ex.Message}");
        }
    }

    public async Task<Result<PictureResponse>> UpdateAsync(
        int id, UpdatePictureRequest request, CancellationToken cancellationToken = default)
    {
        var picture = await _unitOfWork.Pictures.GetByIdAsync(id, cancellationToken);
        if (picture == null)
            return Result<PictureResponse>.Failure("圖片不存在");

        if (!string.IsNullOrEmpty(request.Name)) picture.Name = request.Name;
        if (request.Culture != null) picture.Culture = request.Culture;
        if (request.Type.HasValue) picture.Type = request.Type.Value;
        if (request.ContentType != null) picture.ContentType = request.ContentType;
        if (!string.IsNullOrEmpty(request.Uri)) picture.Uri = request.Uri;
        if (request.ThumbnailUri != null) picture.ThumbnailUri = request.ThumbnailUri;
        if (request.LinkUrl != null) picture.LinkUrl = request.LinkUrl;
        if (request.Published.HasValue) picture.Published = request.Published.Value;
        if (request.StartDate.HasValue) picture.StartDate = request.StartDate;
        if (request.EndDate.HasValue) picture.EndDate = request.EndDate;
        if (request.Ordinal.HasValue) picture.Ordinal = request.Ordinal.Value;
        if (request.Height.HasValue) picture.Height = request.Height.Value;
        if (request.Width.HasValue) picture.Width = request.Width.Value;
        if (request.Dpi.HasValue) picture.Dpi = request.Dpi.Value;
        if (request.Remark != null) picture.Remark = request.Remark;
        if (request.AlbumId.HasValue) picture.AlbumId = request.AlbumId;
        if (request.MultilingualImageId.HasValue) picture.MultilingualImageId = request.MultilingualImageId;
        picture.UpdatedTime = DateTime.UtcNow;

        await _unitOfWork.Pictures.UpdateAsync(picture, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updatedPicture = await _unitOfWork.Pictures.GetByIdWithIncludesAsync(id, cancellationToken);
        return Result<PictureResponse>.Success(MapToResponse(updatedPicture!));
    }

    public async Task<Result<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var picture = await _unitOfWork.Pictures.GetByIdAsync(id, cancellationToken);
        if (picture == null)
            return Result<bool>.Failure("圖片不存在");

        await _unitOfWork.Pictures.DeleteAsync(picture, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }

    public async Task<Result<List<PictureResponse>>> GetByAlbumIdAsync(
        int albumId, CancellationToken cancellationToken = default)
    {
        var pictures = await _unitOfWork.Pictures.GetByAlbumIdAsync(albumId, cancellationToken);
        var response = pictures.Select(MapToResponse).ToList();
        return Result<List<PictureResponse>>.Success(response);
    }

    private PictureResponse MapToResponse(Picture picture)
    {
        return new PictureResponse
        {
            Id = picture.Id,
            Name = picture.Name,
            Culture = picture.Culture,
            Type = picture.Type,
            ContentType = picture.ContentType,
            Uri = picture.Uri,
            ThumbnailUri = picture.ThumbnailUri,
            LinkUrl = picture.LinkUrl,
            Published = picture.Published,
            StartDate = picture.StartDate,
            EndDate = picture.EndDate,
            Ordinal = picture.Ordinal,
            Height = picture.Height,
            Width = picture.Width,
            Dpi = picture.Dpi,
            Remark = picture.Remark,
            AlbumId = picture.AlbumId,
            AlbumTitle = picture.Album?.Title,
            MultilingualImageId = picture.MultilingualImageId,
            CreatedTime = picture.CreatedTime,
            UpdatedTime = picture.UpdatedTime
        };
    }
}