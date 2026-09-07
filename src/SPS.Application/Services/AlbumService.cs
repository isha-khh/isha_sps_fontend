using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Album;
using SPS.Application.DTOs.Common;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;

namespace SPS.Application.Services;

public class AlbumService : IAlbumService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<AlbumService> _logger;

    public AlbumService(IUnitOfWork unitOfWork, ILogger<AlbumService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<PagedResult<AlbumListItemResponse>>> GetPagedAsync(
        AlbumQueryParameters parameters, CancellationToken cancellationToken = default)
    {
        var pagedResult = await _unitOfWork.Albums.GetPagedAsync(parameters, cancellationToken);
        var response = new PagedResult<AlbumListItemResponse>
        {
            Items = pagedResult.Items.Select(a => new AlbumListItemResponse
            {
                Id = a.Id,
                Number = a.Number,
                Title = a.Title,
                Published = a.Published,
                StartDate = a.StartDate,
                Ordinal = a.Ordinal,
                CoverUri = a.Cover?.Uri,
                PictureCount = a.Pictures.Count,
                VideoCount = a.Videos.Count,
                CreatedTime = a.CreatedTime
            }).ToList(),
            TotalCount = pagedResult.TotalCount,
            Page = pagedResult.Page,
            PageSize = pagedResult.PageSize
        };
        return Result<PagedResult<AlbumListItemResponse>>.Success(response);
    }

    public async Task<Result<AlbumResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var album = await _unitOfWork.Albums.GetByIdWithIncludesAsync(id, cancellationToken);
        if (album == null)
            return Result<AlbumResponse>.Failure("相簿不存在");

        return Result<AlbumResponse>.Success(new AlbumResponse
        {
            Id = album.Id,
            Number = album.Number,
            Title = album.Title,
            Published = album.Published,
            StartDate = album.StartDate,
            EndDate = album.EndDate,
            Ordinal = album.Ordinal,
            CoverId = album.CoverId,
            CoverUri = album.Cover?.Uri,
            PictureCount = album.Pictures.Count,
            VideoCount = album.Videos.Count,
            CreatedTime = album.CreatedTime,
            UpdatedTime = album.UpdatedTime
        });
    }

    public async Task<Result<AlbumResponse>> CreateAsync(
        CreateAlbumRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            // 創建相簿實體
            var album = new Album
            {
                Number = request.Number,
                Title = request.Title,
                Published = request.Published,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                Ordinal = request.Ordinal,
                CoverId = request.CoverId,
                DataMode = DataMode.Normal,
                CreatedTime = DateTime.UtcNow,
                UpdatedTime = DateTime.UtcNow
            };

            await _unitOfWork.Albums.AddAsync(album, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // 重新載入以獲取關聯數據
            var createdAlbum = await _unitOfWork.Albums.GetByIdWithIncludesAsync(album.Id, cancellationToken);

            return Result<AlbumResponse>.Success(new AlbumResponse
            {
                Id = album.Id,
                Number = album.Number,
                Title = album.Title,
                Published = album.Published,
                StartDate = album.StartDate,
                EndDate = album.EndDate,
                Ordinal = album.Ordinal,
                CoverId = album.CoverId,
                CoverUri = createdAlbum?.Cover?.Uri,
                PictureCount = 0,
                VideoCount = 0,
                CreatedTime = album.CreatedTime,
                UpdatedTime = album.UpdatedTime
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "創建相簿時發生錯誤: {Message}", ex.Message);
            return Result<AlbumResponse>.Failure($"創建相簿失敗: {ex.Message}");
        }
    }

    public async Task<Result<AlbumResponse>> UpdateAsync(
        int id, UpdateAlbumRequest request, CancellationToken cancellationToken = default)
    {
        var album = await _unitOfWork.Albums.GetByIdAsync(id, cancellationToken);
        if (album == null)
            return Result<AlbumResponse>.Failure("相簿不存在");

        if (!string.IsNullOrEmpty(request.Number)) album.Number = request.Number;
        if (!string.IsNullOrEmpty(request.Title)) album.Title = request.Title;
        if (request.Published.HasValue) album.Published = request.Published.Value;
        if (request.StartDate.HasValue) album.StartDate = request.StartDate;
        if (request.EndDate.HasValue) album.EndDate = request.EndDate;
        if (request.Ordinal.HasValue) album.Ordinal = request.Ordinal.Value;
        if (request.CoverId.HasValue) album.CoverId = request.CoverId;
        album.UpdatedTime = DateTime.UtcNow;

        await _unitOfWork.Albums.UpdateAsync(album, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 重新載入以獲取關聯數據
        var updatedAlbum = await _unitOfWork.Albums.GetByIdWithIncludesAsync(id, cancellationToken);

        return Result<AlbumResponse>.Success(new AlbumResponse
        {
            Id = album.Id,
            Number = album.Number,
            Title = album.Title,
            Published = album.Published,
            StartDate = album.StartDate,
            EndDate = album.EndDate,
            Ordinal = album.Ordinal,
            CoverId = album.CoverId,
            CoverUri = updatedAlbum?.Cover?.Uri,
            PictureCount = updatedAlbum?.Pictures.Count ?? 0,
            VideoCount = updatedAlbum?.Videos.Count ?? 0,
            CreatedTime = album.CreatedTime,
            UpdatedTime = album.UpdatedTime
        });
    }

    public async Task<Result<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var album = await _unitOfWork.Albums.GetByIdAsync(id, cancellationToken);
        if (album == null)
            return Result<bool>.Failure("相簿不存在");

        await _unitOfWork.Albums.DeleteAsync(album, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}