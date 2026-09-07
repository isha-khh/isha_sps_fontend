using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Tag;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;

namespace SPS.Application.Services;

public class TagService : ITagService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<TagService> _logger;

    public TagService(IUnitOfWork unitOfWork, ILogger<TagService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<PagedResult<TagResponse>>> GetPagedAsync(TagQueryParameters parameters, CancellationToken cancellationToken = default)
    {
        var pagedResult = await _unitOfWork.Tags.GetPagedAsync(parameters, cancellationToken);
        var response = new PagedResult<TagResponse>
        {
            Items = new List<TagResponse>(),
            TotalCount = pagedResult.TotalCount,
            Page = pagedResult.Page,
            PageSize = pagedResult.PageSize
        };

        foreach (var tag in pagedResult.Items)
        {
            var usageCount = await _unitOfWork.Tags.GetUsageCountAsync(tag.Id, cancellationToken);
            response.Items.Add(new TagResponse
            {
                Id = tag.Id,
                Type = tag.Type,
                Name = tag.Name,
                Ordinal = tag.Ordinal,
                CategoryId = tag.CategoryId,
                CategoryName = tag.Category?.Name,
                UsageCount = usageCount,
                CreatedTime = tag.CreatedTime,
                UpdatedTime = tag.UpdatedTime
            });
        }

        return Result<PagedResult<TagResponse>>.Success(response);
    }

    public async Task<Result<TagResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var tag = await _unitOfWork.Tags.GetByIdWithIncludesAsync(id, cancellationToken);
        if (tag == null)
            return Result<TagResponse>.Failure("標籤不存在");

        var usageCount = await _unitOfWork.Tags.GetUsageCountAsync(id, cancellationToken);

        return Result<TagResponse>.Success(new TagResponse
        {
            Id = tag.Id,
            Type = tag.Type,
            Name = tag.Name,
            Ordinal = tag.Ordinal,
            CategoryId = tag.CategoryId,
            CategoryName = tag.Category?.Name,
            UsageCount = usageCount,
            CreatedTime = tag.CreatedTime,
            UpdatedTime = tag.UpdatedTime
        });
    }

    public async Task<Result<TagResponse>> CreateAsync(CreateTagRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            var existingTag = await _unitOfWork.Tags.GetByNameAsync(request.Name, request.CategoryId, cancellationToken);
            if (existingTag != null)
                return Result<TagResponse>.Failure("標籤名稱已存在");

            var tag = new Tag
            {
                Type = request.Type,
                Name = request.Name,
                Ordinal = request.Ordinal,
                CategoryId = request.CategoryId,
                CreatedTime = DateTime.UtcNow,
                UpdatedTime = DateTime.UtcNow
            };

            await _unitOfWork.Tags.AddAsync(tag, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var createdTag = await _unitOfWork.Tags.GetByIdWithIncludesAsync(tag.Id, cancellationToken);

            return Result<TagResponse>.Success(new TagResponse
            {
                Id = tag.Id,
                Type = tag.Type,
                Name = tag.Name,
                Ordinal = tag.Ordinal,
                CategoryId = tag.CategoryId,
                CategoryName = createdTag?.Category?.Name,
                UsageCount = 0,
                CreatedTime = tag.CreatedTime,
                UpdatedTime = tag.UpdatedTime
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "創建標籤時發生錯誤: {Message}", ex.Message);
            return Result<TagResponse>.Failure($"創建標籤失敗: {ex.Message}");
        }
    }

    public async Task<Result<TagResponse>> UpdateAsync(int id, UpdateTagRequest request, CancellationToken cancellationToken = default)
    {
        var tag = await _unitOfWork.Tags.GetByIdAsync(id, cancellationToken);
        if (tag == null)
            return Result<TagResponse>.Failure("標籤不存在");

        if (!string.IsNullOrEmpty(request.Name))
        {
            // 以更新後的分類為範圍檢查同名標籤；未指定分類時沿用原分類
            var targetCategoryId = request.CategoryId.HasValue ? request.CategoryId : tag.CategoryId;
            var existingTag = await _unitOfWork.Tags.GetByNameAsync(request.Name, targetCategoryId, cancellationToken);
            if (existingTag != null && existingTag.Id != id)
                return Result<TagResponse>.Failure("標籤名稱已存在");
            tag.Name = request.Name;
        }

        if (request.Type.HasValue) tag.Type = request.Type.Value;
        if (request.Ordinal.HasValue) tag.Ordinal = request.Ordinal.Value;
        if (request.CategoryId.HasValue) tag.CategoryId = request.CategoryId;
        tag.UpdatedTime = DateTime.UtcNow;

        await _unitOfWork.Tags.UpdateAsync(tag, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updatedTag = await _unitOfWork.Tags.GetByIdWithIncludesAsync(id, cancellationToken);
        var usageCount = await _unitOfWork.Tags.GetUsageCountAsync(id, cancellationToken);

        return Result<TagResponse>.Success(new TagResponse
        {
            Id = tag.Id,
            Type = tag.Type,
            Name = tag.Name,
            Ordinal = tag.Ordinal,
            CategoryId = tag.CategoryId,
            CategoryName = updatedTag?.Category?.Name,
            UsageCount = usageCount,
            CreatedTime = tag.CreatedTime,
            UpdatedTime = tag.UpdatedTime
        });
    }

    public async Task<Result<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var tag = await _unitOfWork.Tags.GetByIdAsync(id, cancellationToken);
        if (tag == null)
            return Result<bool>.Failure("標籤不存在");

        var usageCount = await _unitOfWork.Tags.GetUsageCountAsync(id, cancellationToken);
        if (usageCount > 0)
            return Result<bool>.Failure($"此標籤正在被 {usageCount} 個項目使用，無法刪除");

        await _unitOfWork.Tags.DeleteAsync(tag, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}