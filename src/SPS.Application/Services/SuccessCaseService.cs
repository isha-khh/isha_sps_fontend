using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.SuccessCase;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;
using System.Text.Json;

namespace SPS.Application.Services;

public class SuccessCaseService : ISuccessCaseService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<SuccessCaseService> _logger;

    public SuccessCaseService(IUnitOfWork unitOfWork, ILogger<SuccessCaseService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<object>> GetPagedAsync(SuccessCaseQueryParameters parameters)
    {
        try
        {
            IQueryable<SuccessCase> query = _unitOfWork.SuccessCases.GetQueryable()
                .Where(sc => sc.DataMode == DataMode.Normal)
                .Include(sc => sc.Title);

            if (!string.IsNullOrWhiteSpace(parameters.Search))
            {
                var search = parameters.Search.ToLower();
                query = query.Where(sc =>
                    (sc.Title != null && sc.Title.DefaultText != null && sc.Title.DefaultText.ToLower().Contains(search)) ||
                    sc.CompanyName.ToLower().Contains(search) ||
                    sc.Industry.ToLower().Contains(search));
            }

            if (!string.IsNullOrWhiteSpace(parameters.Industry))
                query = query.Where(sc => sc.Industry == parameters.Industry);

            if (!string.IsNullOrWhiteSpace(parameters.Tag))
                query = query.Where(sc => sc.Tags != null && sc.Tags.Contains(parameters.Tag));

            if (parameters.IsPublished.HasValue)
                query = query.Where(sc => sc.IsPublished == parameters.IsPublished.Value);

            if (parameters.PublishedDateFrom.HasValue)
                query = query.Where(sc => sc.PublishedDate >= parameters.PublishedDateFrom.Value);

            if (parameters.PublishedDateTo.HasValue)
                query = query.Where(sc => sc.PublishedDate <= parameters.PublishedDateTo.Value);

            query = query.OrderByDescending(sc => sc.PublishedDate);

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((parameters.Page - 1) * parameters.PageSize)
                .Take(parameters.PageSize)
                .ToListAsync();

            var dtos = new List<SuccessCaseDto>();
            foreach (var item in items)
            {
                dtos.Add(await MapToDtoAsync(item));
            }

            var result = new PagedResult<SuccessCaseDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                Page = parameters.Page,
                PageSize = parameters.PageSize
            };

            return Result<object>.Success(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting paged success cases");
            return Result<object>.Failure($"獲取成功案例列表失敗: {ex.Message}");
        }
    }

    public async Task<Result<SuccessCaseDto>> GetByIdAsync(int id)
    {
        try
        {
            var successCase = await _unitOfWork.SuccessCases.GetByIdAsync(id);
            if (successCase == null)
                return Result<SuccessCaseDto>.Failure("成功案例不存在");

            var dto = await MapToDtoAsync(successCase);
            return Result<SuccessCaseDto>.Success(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting success case by id: {Id}", id);
            return Result<SuccessCaseDto>.Failure($"獲取成功案例失敗: {ex.Message}");
        }
    }

    public async Task<Result<SuccessCaseDto>> CreateAsync(CreateSuccessCaseRequest request)
    {
        try
        {
            // 創建多語言文本記錄
            var title = new MultilingualText { DefaultText = request.Title };
            var summary = new MultilingualText { DefaultText = request.Summary };
            var content = new MultilingualText { DefaultText = request.Content };

            await _unitOfWork.MultilingualTexts.AddAsync(title);
            await _unitOfWork.MultilingualTexts.AddAsync(summary);
            await _unitOfWork.MultilingualTexts.AddAsync(content);
            await _unitOfWork.SaveChangesAsync();

            var successCase = new SuccessCase
            {
                TitleId = title.Id,
                SummaryId = summary.Id,
                ContentId = content.Id,
                CompanyName = request.CompanyName,
                Industry = request.Industry,
                CoverImageUrl = request.CoverImageUrl,
                ViewCount = 0,
                IsPublished = request.IsPublished,
                PublishedDate = request.PublishedDate,
                DataMode = DataMode.Normal
            };

            if (request.Tags != null && request.Tags.Any())
                successCase.Tags = JsonSerializer.Serialize(request.Tags);

            await _unitOfWork.SuccessCases.AddAsync(successCase);
            await _unitOfWork.SaveChangesAsync();

            var dto = await MapToDtoAsync(successCase);
            return Result<SuccessCaseDto>.Success(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating success case");
            return Result<SuccessCaseDto>.Failure($"創建成功案例失敗: {ex.Message}");
        }
    }

    public async Task<Result<SuccessCaseDto>> UpdateAsync(int id, UpdateSuccessCaseRequest request)
    {
        try
        {
            var successCase = await _unitOfWork.SuccessCases.GetByIdAsync(id);
            if (successCase == null)
                return Result<SuccessCaseDto>.Failure("成功案例不存在");

            if (!string.IsNullOrEmpty(request.CompanyName))
                successCase.CompanyName = request.CompanyName;
            if (!string.IsNullOrEmpty(request.Industry))
                successCase.Industry = request.Industry;
            if (request.CoverImageUrl != null)
                successCase.CoverImageUrl = request.CoverImageUrl;
            if (request.Tags != null)
                successCase.Tags = JsonSerializer.Serialize(request.Tags);
            if (request.PublishedDate.HasValue)
                successCase.PublishedDate = request.PublishedDate;
            if (request.IsPublished.HasValue)
                successCase.IsPublished = request.IsPublished.Value;

            // 更新多語言文本
            if (!string.IsNullOrEmpty(request.Title))
            {
                var title = await _unitOfWork.MultilingualTexts.GetByIdAsync(successCase.TitleId);
                if (title != null)
                {
                    title.DefaultText = request.Title;
                    await _unitOfWork.MultilingualTexts.UpdateAsync(title);
                }
            }
            if (!string.IsNullOrEmpty(request.Summary))
            {
                var summary = await _unitOfWork.MultilingualTexts.GetByIdAsync(successCase.SummaryId);
                if (summary != null)
                {
                    summary.DefaultText = request.Summary;
                    await _unitOfWork.MultilingualTexts.UpdateAsync(summary);
                }
            }
            if (!string.IsNullOrEmpty(request.Content))
            {
                var content = await _unitOfWork.MultilingualTexts.GetByIdAsync(successCase.ContentId);
                if (content != null)
                {
                    content.DefaultText = request.Content;
                    await _unitOfWork.MultilingualTexts.UpdateAsync(content);
                }
            }

            _unitOfWork.SuccessCases.Update(successCase);
            await _unitOfWork.SaveChangesAsync();

            var dto = await MapToDtoAsync(successCase);
            return Result<SuccessCaseDto>.Success(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating success case: {Id}", id);
            return Result<SuccessCaseDto>.Failure($"更新成功案例失敗: {ex.Message}");
        }
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        try
        {
            var successCase = await _unitOfWork.SuccessCases.GetByIdAsync(id);
            if (successCase == null)
                return Result<bool>.Failure("成功案例不存在");

            _unitOfWork.SuccessCases.Remove(successCase);
            await _unitOfWork.SaveChangesAsync();

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting success case: {Id}", id);
            return Result<bool>.Failure($"刪除成功案例失敗: {ex.Message}");
        }
    }

    public async Task<Result<SuccessCaseDto>> UpdatePublishStatusAsync(int id, bool isPublished)
    {
        try
        {
            var successCase = await _unitOfWork.SuccessCases.GetByIdAsync(id);
            if (successCase == null)
                return Result<SuccessCaseDto>.Failure("成功案例不存在");

            successCase.IsPublished = isPublished;
            if (isPublished && !successCase.PublishedDate.HasValue)
                successCase.PublishedDate = DateTime.UtcNow;

            _unitOfWork.SuccessCases.Update(successCase);
            await _unitOfWork.SaveChangesAsync();

            var dto = await MapToDtoAsync(successCase);
            return Result<SuccessCaseDto>.Success(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating success case publish status: {Id}", id);
            return Result<SuccessCaseDto>.Failure($"更新成功案例發布狀態失敗: {ex.Message}");
        }
    }

    public async Task<Result<bool>> IncrementViewCountAsync(int id)
    {
        try
        {
            await _unitOfWork.SuccessCases.IncrementViewCountAsync(id);
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error incrementing view count: {Id}", id);
            return Result<bool>.Failure($"增加瀏覽次數失敗: {ex.Message}");
        }
    }

    public async Task<Result<SuccessCaseStatisticsDto>> GetStatisticsAsync()
    {
        try
        {
            var query = _unitOfWork.SuccessCases.GetQueryable()
                .Where(sc => sc.DataMode == DataMode.Normal);
            var allCases = await query.ToListAsync();

            var statistics = new SuccessCaseStatisticsDto
            {
                TotalCases = allCases.Count,
                PublishedCases = allCases.Count(sc => sc.IsPublished),
                DraftCases = allCases.Count(sc => !sc.IsPublished),
                TotalViews = allCases.Sum(sc => sc.ViewCount)
            };

            return Result<SuccessCaseStatisticsDto>.Success(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting success case statistics");
            return Result<SuccessCaseStatisticsDto>.Failure($"獲取成功案例統計失敗: {ex.Message}");
        }
    }

    private async Task<SuccessCaseDto> MapToDtoAsync(SuccessCase successCase)
    {
        List<string>? tags = null;
        if (!string.IsNullOrEmpty(successCase.Tags))
        {
            try
            {
                tags = JsonSerializer.Deserialize<List<string>>(successCase.Tags);
            }
            catch { }
        }

        // 獲取多語言文本
        var title = await _unitOfWork.MultilingualTexts.GetByIdAsync(successCase.TitleId);
        var summary = await _unitOfWork.MultilingualTexts.GetByIdAsync(successCase.SummaryId);
        var content = await _unitOfWork.MultilingualTexts.GetByIdAsync(successCase.ContentId);

        return new SuccessCaseDto
        {
            Id = successCase.Id,
            Title = title?.DefaultText ?? string.Empty,
            CompanyName = successCase.CompanyName,
            Industry = successCase.Industry,
            CoverImageUrl = successCase.CoverImageUrl,
            Summary = summary?.DefaultText ?? string.Empty,
            Content = content?.DefaultText ?? string.Empty,
            Tags = tags,
            PublishedDate = successCase.PublishedDate,
            IsPublished = successCase.IsPublished,
            ViewCount = successCase.ViewCount,
            CreatedTime = successCase.CreatedTime,
            UpdatedTime = successCase.UpdatedTime
        };
    }
}
