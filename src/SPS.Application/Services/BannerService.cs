using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Banner;
using SPS.Application.DTOs.Common;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;

namespace SPS.Application.Services;

public class BannerService : IBannerService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<BannerService> _logger;

    public BannerService(IUnitOfWork unitOfWork, ILogger<BannerService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<PagedResult<BannerListItemResponse>>> GetPagedAsync(
        BannerQueryParameters parameters, CancellationToken cancellationToken = default)
    {
        var pagedResult = await _unitOfWork.Banners.GetPagedAsync(parameters, cancellationToken);
        var response = new PagedResult<BannerListItemResponse>
        {
            Items = pagedResult.Items.Select(b => new BannerListItemResponse
            {
                Id = b.Id,
                Name = b.Name,
                ContentType = b.ContentType,
                Uri = b.Uri,
                LinkUrl = b.LinkUrl,
                LinkTarget = b.LinkTarget,
                Remark = b.Remark,
                ClickCount = b.ClickCount,
                ViewCount = b.ViewCount,
                PositionId = b.PositionId,
                PositionName = b.Position?.Name,
                CreatedTime = b.CreatedTime,
                UpdatedTime = b.UpdatedTime
            }).ToList(),
            TotalCount = pagedResult.TotalCount,
            Page = pagedResult.Page,
            PageSize = pagedResult.PageSize
        };
        return Result<PagedResult<BannerListItemResponse>>.Success(response);
    }

    public async Task<Result<BannerResponse>> GetByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        var banner = await _unitOfWork.Banners.GetByIdWithIncludesAsync(id, cancellationToken);
        if (banner == null)
            return Result<BannerResponse>.Failure("Banner 不存在");

        return Result<BannerResponse>.Success(new BannerResponse
        {
            Id = banner.Id,
            Name = banner.Name,
            ContentType = banner.ContentType,
            Uri = banner.Uri,
            LinkUrl = banner.LinkUrl,
            LinkTarget = banner.LinkTarget,
            ClickCount = banner.ClickCount,
            ViewCount = banner.ViewCount,
            Remark = banner.Remark,
            PositionId = banner.PositionId,
            PositionName = banner.Position?.Name,
            CreatedTime = banner.CreatedTime,
            UpdatedTime = banner.UpdatedTime
        });
    }

    public async Task<Result<BannerResponse>> CreateAsync(
        CreateBannerRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            // 創建 Banner 實體
            // 注意：PositionId 的外鍵驗證由資料庫約束處理
            var banner = new Banner
            {
                Name = request.Name,
                ContentType = request.ContentType,
                Uri = request.Uri,
                LinkUrl = request.LinkUrl,
                LinkTarget = request.LinkTarget ?? "_self",
                Remark = request.Remark,
                PositionId = request.PositionId,
                ClickCount = 0,
                ViewCount = 0,
                CreatedTime = DateTime.UtcNow,
                UpdatedTime = DateTime.UtcNow
            };

            await _unitOfWork.Banners.AddAsync(banner, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // 重新載入以獲取關聯數據
            var createdBanner = await _unitOfWork.Banners.GetByIdWithIncludesAsync(banner.Id, cancellationToken);

            return Result<BannerResponse>.Success(new BannerResponse
            {
                Id = banner.Id,
                Name = banner.Name,
                ContentType = banner.ContentType,
                Uri = banner.Uri,
                LinkUrl = banner.LinkUrl,
                LinkTarget = banner.LinkTarget,
                ClickCount = banner.ClickCount,
                ViewCount = banner.ViewCount,
                Remark = banner.Remark,
                PositionId = banner.PositionId,
                PositionName = createdBanner?.Position?.Name,
                CreatedTime = banner.CreatedTime,
                UpdatedTime = banner.UpdatedTime
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "創建 Banner 時發生錯誤: {Message}", ex.Message);
            return Result<BannerResponse>.Failure($"創建 Banner 失敗: {ex.Message}");
        }
    }

    public async Task<Result<BannerResponse>> UpdateAsync(
        long id, UpdateBannerRequest request, CancellationToken cancellationToken = default)
    {
        var banner = await _unitOfWork.Banners.GetByIdAsync(id, cancellationToken);
        if (banner == null)
            return Result<BannerResponse>.Failure("Banner 不存在");

        // 注意：PositionId 的外鍵驗證由資料庫約束處理
        if (!string.IsNullOrEmpty(request.Name)) banner.Name = request.Name;
        if (request.ContentType != null) banner.ContentType = request.ContentType;
        if (!string.IsNullOrEmpty(request.Uri)) banner.Uri = request.Uri;
        if (request.LinkUrl != null) banner.LinkUrl = request.LinkUrl;
        if (request.LinkTarget != null) banner.LinkTarget = request.LinkTarget;
        if (request.Remark != null) banner.Remark = request.Remark;
        if (request.PositionId.HasValue) banner.PositionId = request.PositionId;
        banner.UpdatedTime = DateTime.UtcNow;

        await _unitOfWork.Banners.UpdateAsync(banner, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 重新載入以獲取關聯數據
        var updatedBanner = await _unitOfWork.Banners.GetByIdWithIncludesAsync(id, cancellationToken);

        return Result<BannerResponse>.Success(new BannerResponse
        {
            Id = banner.Id,
            Name = banner.Name,
            ContentType = banner.ContentType,
            Uri = banner.Uri,
            LinkUrl = banner.LinkUrl,
            LinkTarget = banner.LinkTarget,
            ClickCount = banner.ClickCount,
            ViewCount = banner.ViewCount,
            Remark = banner.Remark,
            PositionId = banner.PositionId,
            PositionName = updatedBanner?.Position?.Name,
            CreatedTime = banner.CreatedTime,
            UpdatedTime = banner.UpdatedTime
        });
    }

    public async Task<Result<bool>> DeleteAsync(long id, CancellationToken cancellationToken = default)
    {
        var banner = await _unitOfWork.Banners.GetByIdAsync(id, cancellationToken);
        if (banner == null)
            return Result<bool>.Failure("Banner 不存在");

        await _unitOfWork.Banners.DeleteAsync(banner, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }

    public async Task<Result<List<BannerResponse>>> GetByPositionIdAsync(
        int positionId, CancellationToken cancellationToken = default)
    {
        var banners = await _unitOfWork.Banners.GetByPositionIdAsync(positionId, cancellationToken);
        var response = banners.Select(b => new BannerResponse
        {
            Id = b.Id,
            Name = b.Name,
            ContentType = b.ContentType,
            Uri = b.Uri,
            LinkUrl = b.LinkUrl,
            LinkTarget = b.LinkTarget,
            ClickCount = b.ClickCount,
            ViewCount = b.ViewCount,
            Remark = b.Remark,
            PositionId = b.PositionId,
            PositionName = b.Position?.Name,
            CreatedTime = b.CreatedTime,
            UpdatedTime = b.UpdatedTime
        }).ToList();

        return Result<List<BannerResponse>>.Success(response);
    }

    public async Task<Result<bool>> IncrementViewCountAsync(long id, CancellationToken cancellationToken = default)
    {
        var banner = await _unitOfWork.Banners.GetByIdAsync(id, cancellationToken);
        if (banner == null)
            return Result<bool>.Failure("Banner 不存在");

        banner.ViewCount++;
        banner.UpdatedTime = DateTime.UtcNow;

        await _unitOfWork.Banners.UpdateAsync(banner, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> IncrementClickCountAsync(long id, CancellationToken cancellationToken = default)
    {
        var banner = await _unitOfWork.Banners.GetByIdAsync(id, cancellationToken);
        if (banner == null)
            return Result<bool>.Failure("Banner 不存在");

        banner.ClickCount++;
        banner.UpdatedTime = DateTime.UtcNow;

        await _unitOfWork.Banners.UpdateAsync(banner, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}