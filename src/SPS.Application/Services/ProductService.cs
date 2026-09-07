using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Picture;
using SPS.Application.DTOs.Product;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;

namespace SPS.Application.Services;

public class ProductService : IProductService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<ProductService> _logger;

    public ProductService(IUnitOfWork unitOfWork, ILogger<ProductService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<PagedResult<ProductListItemResponse>>> GetPagedAsync(
        ProductQueryParameters parameters, CancellationToken cancellationToken = default)
    {
        var pagedResult = await _unitOfWork.Products.GetPagedAsync(parameters, cancellationToken);
        var response = new PagedResult<ProductListItemResponse>
        {
            Items = pagedResult.Items.Select(p => new ProductListItemResponse
            {
                Id = p.Id,
                Number = p.Number,
                Name = p.Name,
                ModelNo = p.ModelNo,
                Unit = p.Unit,
                CompanyId = p.CompanyId,
                CompanyName = p.Company?.Name,
                Published = p.Published,
                Photo = p.Cover?.Uri,
                CreatedTime = p.CreatedTime
            }).ToList(),
            TotalCount = pagedResult.TotalCount,
            Page = pagedResult.Page,
            PageSize = pagedResult.PageSize
        };
        return Result<PagedResult<ProductListItemResponse>>.Success(response);
    }

    public async Task<Result<ProductResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(id, cancellationToken);
        if (product == null)
            return Result<ProductResponse>.Failure("產品不存在");

        return Result<ProductResponse>.Success(MapToResponse(product));
    }

    public async Task<Result<ProductResponse>> CreateAsync(
        CreateProductRequest request, CancellationToken cancellationToken = default)
    {
        var product = new Product
        {
            Number = $"P{DateTime.UtcNow:yyyyMMddHHmmss}",
            Name = request.Name,
            ModelNo = request.ModelNo,
            Mixed = request.Mixed,
            Unit = request.Unit,
            LengthUnit = request.LengthUnit,
            Height = request.Height,
            Width = request.Width,
            Depth = request.Depth,
            WeightUnit = request.WeightUnit,
            NetWeight = request.NetWeight,
            GrossWeight = request.GrossWeight,
            ConditionedWeight = request.ConditionedWeight,
            Introduction = request.Introduction,
            Remark = request.Remark,
            CategoryId = request.CategoryId,
            CompanyId = request.CompanyId,
            CoverId = request.CoverId,
            Published = request.Published,
            DataMode = DataMode.Normal,
            CreatedTime = DateTime.UtcNow,
            UpdatedTime = DateTime.UtcNow
        };

        await _unitOfWork.Products.AddAsync(product, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 處理產品圖片
        if (request.PictureIds != null && request.PictureIds.Any())
        {
            var ordinal = 0;
            foreach (var pictureId in request.PictureIds)
            {
                var picture = await _unitOfWork.Pictures.GetByIdAsync(pictureId, cancellationToken);
                if (picture != null)
                {
                    picture.ProductId = product.Id;
                    picture.Ordinal = ordinal++;
                    await _unitOfWork.Pictures.UpdateAsync(picture, cancellationToken);
                }
            }
        }

        // 處理產品文件（UploadedFile）
        if (request.FileIds != null && request.FileIds.Any())
        {
            foreach (var fileId in request.FileIds)
            {
                var file = await _unitOfWork.Files.GetByIdAsync(fileId, cancellationToken);
                if (file != null)
                {
                    file.ProductId = product.Id;
                    await _unitOfWork.Files.UpdateAsync(file, cancellationToken);
                }
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Reload to get navigation properties
        var createdProduct = await _unitOfWork.Products.GetByIdAsync(product.Id, cancellationToken);

        return Result<ProductResponse>.Success(MapToResponse(createdProduct!));
    }

    public async Task<Result<ProductResponse>> UpdateAsync(
        int id, UpdateProductRequest request, CancellationToken cancellationToken = default)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(id, cancellationToken);
        if (product == null)
            return Result<ProductResponse>.Failure("產品不存在");

        if (request.Name != null) product.Name = request.Name;
        if (request.ModelNo != null) product.ModelNo = request.ModelNo;
        if (request.Mixed.HasValue) product.Mixed = request.Mixed.Value;
        if (request.Unit != null) product.Unit = request.Unit;
        if (request.LengthUnit.HasValue) product.LengthUnit = request.LengthUnit;
        if (request.Height.HasValue) product.Height = request.Height;
        if (request.Width.HasValue) product.Width = request.Width;
        if (request.Depth.HasValue) product.Depth = request.Depth;
        if (request.WeightUnit.HasValue) product.WeightUnit = request.WeightUnit;
        if (request.NetWeight.HasValue) product.NetWeight = request.NetWeight;
        if (request.GrossWeight.HasValue) product.GrossWeight = request.GrossWeight;
        if (request.ConditionedWeight.HasValue) product.ConditionedWeight = request.ConditionedWeight;
        if (request.Introduction != null) product.Introduction = request.Introduction;
        if (request.Remark != null) product.Remark = request.Remark;
        if (request.CategoryId.HasValue) product.CategoryId = request.CategoryId;
        if (request.Published.HasValue) product.Published = request.Published.Value;

        // 處理封面圖片
        if (request.RemoveCover)
        {
            product.CoverId = null;
        }
        else if (request.CoverId.HasValue)
        {
            product.CoverId = request.CoverId.Value;
        }

        // 處理產品圖片（取代現有圖片）
        if (request.PictureIds != null)
        {
            // 清除現有圖片的關聯
            foreach (var existingPicture in product.Pictures.ToList())
            {
                existingPicture.ProductId = null;
                await _unitOfWork.Pictures.UpdateAsync(existingPicture, cancellationToken);
            }

            // 設定新的圖片關聯
            var ordinal = 0;
            foreach (var pictureId in request.PictureIds)
            {
                var picture = await _unitOfWork.Pictures.GetByIdAsync(pictureId, cancellationToken);
                if (picture != null)
                {
                    picture.ProductId = product.Id;
                    picture.Ordinal = ordinal++;
                    await _unitOfWork.Pictures.UpdateAsync(picture, cancellationToken);
                }
            }
        }

        // 處理產品文件（取代現有文件，使用 UploadedFile）
        if (request.FileIds != null)
        {
            // 清除現有文件的關聯
            foreach (var existingFile in product.UploadedFiles.ToList())
            {
                existingFile.ProductId = null;
                await _unitOfWork.Files.UpdateAsync(existingFile, cancellationToken);
            }

            // 設定新的文件關聯
            foreach (var fileId in request.FileIds)
            {
                var file = await _unitOfWork.Files.GetByIdAsync(fileId, cancellationToken);
                if (file != null)
                {
                    file.ProductId = product.Id;
                    await _unitOfWork.Files.UpdateAsync(file, cancellationToken);
                }
            }
        }

        product.UpdatedTime = DateTime.UtcNow;

        await _unitOfWork.Products.UpdateAsync(product, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Reload to get navigation properties
        var updatedProduct = await _unitOfWork.Products.GetByIdAsync(product.Id, cancellationToken);

        return Result<ProductResponse>.Success(MapToResponse(updatedProduct!));
    }

    public async Task<Result<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(id, cancellationToken);
        if (product == null)
            return Result<bool>.Failure("產品不存在");

        await _unitOfWork.Products.DeleteAsync(product, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }

    private static ProductResponse MapToResponse(Product product)
    {
        return new ProductResponse
        {
            Id = product.Id,
            Number = product.Number,
            Name = product.Name,
            ModelNo = product.ModelNo,
            Mixed = product.Mixed,
            Unit = product.Unit,
            LengthUnit = product.LengthUnit,
            Height = product.Height,
            Width = product.Width,
            Depth = product.Depth,
            WeightUnit = product.WeightUnit,
            NetWeight = product.NetWeight,
            GrossWeight = product.GrossWeight,
            ConditionedWeight = product.ConditionedWeight,
            Introduction = product.Introduction,
            Remark = product.Remark,
            CategoryId = product.CategoryId,
            CompanyId = product.CompanyId,
            CompanyName = product.Company?.Name,
            Published = product.Published,
            Cover = product.Cover != null ? MapToPictureResponse(product.Cover) : null,
            Pictures = product.Pictures?.Select(MapToPictureResponse).ToList() ?? new List<PictureResponse>(),
            PictureCount = product.Pictures?.Count ?? 0,
            Files = product.UploadedFiles?.Select(MapToFileResponse).ToList() ?? new List<ProductFileResponse>(),
            FileCount = product.UploadedFiles?.Count ?? 0,
            CreatedTime = product.CreatedTime,
            UpdatedTime = product.UpdatedTime
        };
    }

    private static ProductFileResponse MapToFileResponse(UploadedFile file)
    {
        return new ProductFileResponse
        {
            Id = file.Id,
            FileNumber = file.FileNumber,
            OriginalFileName = file.OriginalFileName,
            FileExtension = file.FileExtension,
            ContentType = file.ContentType,
            FileSize = file.FileSize,
            FormattedFileSize = FormatFileSize(file.FileSize),
            FileUrl = $"/api/FileManagement/{file.Id}/download",
            CreatedTime = file.CreatedTime
        };
    }

    private static string FormatFileSize(long bytes)
    {
        string[] sizes = ["B", "KB", "MB", "GB"];
        var order = 0;
        var size = (double)bytes;
        while (size >= 1024 && order < sizes.Length - 1)
        {
            order++;
            size /= 1024;
        }
        return $"{size:0.##} {sizes[order]}";
    }
    
    private static PictureResponse MapToPictureResponse(Picture picture)
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
