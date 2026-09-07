using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.News;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;

namespace SPS.Application.Services;

public class NewsService : INewsService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<NewsService> _logger;

    public NewsService(IUnitOfWork unitOfWork, ILogger<NewsService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<PagedResult<NewsListItemResponse>>> GetPagedAsync(
        NewsQueryParameters parameters, CancellationToken cancellationToken = default)
    {
        var pagedResult = await _unitOfWork.News.GetPagedAsync(parameters, cancellationToken);
        var response = new PagedResult<NewsListItemResponse>
        {
            Items = pagedResult.Items.Select(n => new NewsListItemResponse
            {
                Id = n.Id,
                Title = n.Title?.DefaultText ?? string.Empty,
                Introduction = n.Introduction?.DefaultText,
                StartDate = n.StartDate,
                Published = n.Published,
                CategoryId = n.CategoryId,
                CategoryName = n.Category?.Name,
                ViewCount = n.ViewCount,
                CreatedTime = n.CreatedTime
            }).ToList(),
            TotalCount = pagedResult.TotalCount,
            Page = pagedResult.Page,
            PageSize = pagedResult.PageSize
        };
        return Result<PagedResult<NewsListItemResponse>>.Success(response);
    }

    public async Task<Result<NewsResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var news = await _unitOfWork.News.GetByIdWithIncludesAsync(id, cancellationToken);
        if (news == null)
            return Result<NewsResponse>.Failure("新聞不存在");

        // 查詢標簽
        var tags = await _unitOfWork.News.GetNewsTagsAsync(id, cancellationToken);

        return Result<NewsResponse>.Success(new NewsResponse
        {
            Id = news.Id,
            Title = news.Title?.DefaultText ?? string.Empty,
            Introduction = news.Introduction?.DefaultText,
            Content = news.Content?.DefaultText,
            StartDate = news.StartDate,
            EndDate = news.EndDate,
            Published = news.Published,
            Ordinal = news.Ordinal,
            CategoryId = news.CategoryId,
            CategoryName = news.Category?.Name,
            Type = news.Type,
            ViewCount = news.ViewCount,
            Tags = tags,
            CreatedTime = news.CreatedTime,
            UpdatedTime = news.UpdatedTime
        });
    }

    public async Task<Result<NewsResponse>> CreateAsync(
        CreateNewsRequest request, CancellationToken cancellationToken = default)
    {
        // 開始資料庫事務以確保原子性
        await using var transaction = await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            // 驗證 CategoryId 是否存在（如果提供了的話）
            if (request.CategoryId.HasValue)
            {
                var categoryExists = await _unitOfWork.Categories.GetByIdAsync(request.CategoryId.Value, cancellationToken);
                if (categoryExists == null)
                    return Result<NewsResponse>.Failure($"分類 ID {request.CategoryId.Value} 不存在，請選擇有效的分類");
            }

            // 創建多語言文本
            var title = await _unitOfWork.MultilingualTexts.CreateTextAsync(request.Title, cancellationToken);
            var introduction = !string.IsNullOrEmpty(request.Introduction)
                ? await _unitOfWork.MultilingualTexts.CreateTextAsync(request.Introduction, cancellationToken)
                : null;
            var content = !string.IsNullOrEmpty(request.Content)
                ? await _unitOfWork.MultilingualTexts.CreateTextAsync(request.Content, cancellationToken)
                : null;

            // 保存多語言文本以獲取生成的 ID
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // 創建新聞實體
            var news = new News
            {
                TitleId = title.Id,
                IntroductionId = introduction?.Id,
                ContentId = content?.Id,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                Published = request.Published,
                Ordinal = request.Ordinal,
                CategoryId = request.CategoryId,
                Type = request.Type,
                CreatedTime = DateTime.UtcNow,
                UpdatedTime = DateTime.UtcNow
            };

            await _unitOfWork.News.AddAsync(news, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // 提交事務
            await transaction.CommitAsync(cancellationToken);

            return Result<NewsResponse>.Success(new NewsResponse
            {
                Id = news.Id,
                Title = request.Title,
                Introduction = request.Introduction,
                Content = request.Content,
                StartDate = news.StartDate,
                EndDate = news.EndDate,
                Published = news.Published,
                Ordinal = news.Ordinal,
                CategoryId = news.CategoryId,
                Type = news.Type,
                ViewCount = news.ViewCount,
                Tags = new List<string>(),
                CreatedTime = news.CreatedTime,
                UpdatedTime = news.UpdatedTime
            });
        }
        catch (Exception ex)
        {
            // 發生錯誤時回滾事務
            await transaction.RollbackAsync(cancellationToken);
            _logger.LogError(ex, "創建新聞時發生錯誤: {Message}", ex.Message);
            return Result<NewsResponse>.Failure($"創建新聞失敗: {ex.Message}");
        }
    }

    public async Task<Result<NewsResponse>> UpdateAsync(
        int id, UpdateNewsRequest request, CancellationToken cancellationToken = default)
    {
        var news = await _unitOfWork.News.GetByIdAsync(id, cancellationToken);
        if (news == null)
            return Result<NewsResponse>.Failure("新聞不存在");

        // 驗證 CategoryId 是否存在
        if (request.CategoryId.HasValue)
        {
            var categoryExists = await _unitOfWork.Categories.GetByIdAsync(request.CategoryId.Value, cancellationToken);
            if (categoryExists == null)
                return Result<NewsResponse>.Failure($"分類 ID {request.CategoryId.Value} 不存在，請選擇有效的分類");
        }

        // 更新 Title (MultilingualText)
        if (!string.IsNullOrEmpty(request.Title))
        {
            if (news.TitleId.HasValue && news.Title != null)
            {
                // 更新現有的 Title
                news.Title.DefaultText = request.Title;
                await _unitOfWork.MultilingualTexts.UpdateAsync(news.Title, cancellationToken);
            }
            else
            {
                // 創建新的 Title
                var title = new MultilingualText { DefaultText = request.Title };
                await _unitOfWork.MultilingualTexts.AddAsync(title, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                news.TitleId = title.Id;
            }
        }

        // 更新 Introduction (MultilingualText)
        if (request.Introduction != null)
        {
            if (news.IntroductionId.HasValue && news.Introduction != null)
            {
                // 更新現有的 Introduction
                news.Introduction.DefaultText = request.Introduction;
                await _unitOfWork.MultilingualTexts.UpdateAsync(news.Introduction, cancellationToken);
            }
            else if (!string.IsNullOrEmpty(request.Introduction))
            {
                // 創建新的 Introduction
                var introduction = new MultilingualText { DefaultText = request.Introduction };
                await _unitOfWork.MultilingualTexts.AddAsync(introduction, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                news.IntroductionId = introduction.Id;
            }
        }

        // 更新 Content (MultilingualText) - 重要！Puck JSON 儲存在這裡
        if (request.Content != null)
        {
            if (news.ContentId.HasValue && news.Content != null)
            {
                // 更新現有的 Content
                news.Content.DefaultText = request.Content;
                await _unitOfWork.MultilingualTexts.UpdateAsync(news.Content, cancellationToken);
                _logger.LogInformation("Updated content for news {NewsId}, new length: {Length}", id, request.Content.Length);
            }
            else if (!string.IsNullOrEmpty(request.Content))
            {
                // 創建新的 Content
                var content = new MultilingualText { DefaultText = request.Content };
                await _unitOfWork.MultilingualTexts.AddAsync(content, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                news.ContentId = content.Id;
                _logger.LogInformation("Created new content for news {NewsId}, length: {Length}", id, request.Content.Length);
            }
        }

        // 更新其他欄位
        if (request.StartDate.HasValue) news.StartDate = request.StartDate;
        if (request.EndDate.HasValue) news.EndDate = request.EndDate;
        if (request.Published.HasValue) news.Published = request.Published.Value;
        if (request.Ordinal.HasValue) news.Ordinal = request.Ordinal.Value;
        if (request.CategoryId.HasValue) news.CategoryId = request.CategoryId;
        if (request.Type.HasValue) news.Type = request.Type.Value;
        news.UpdatedTime = DateTime.UtcNow;

        await _unitOfWork.News.UpdateAsync(news, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<NewsResponse>.Success(new NewsResponse
        {
            Id = news.Id,
            Title = news.Title?.DefaultText ?? request.Title ?? string.Empty,
            Introduction = news.Introduction?.DefaultText ?? request.Introduction,
            Content = news.Content?.DefaultText ?? request.Content,
            StartDate = news.StartDate,
            EndDate = news.EndDate,
            Published = news.Published,
            Ordinal = news.Ordinal,
            CategoryId = news.CategoryId,
            CategoryName = news.Category?.Name,
            Type = news.Type,
            ViewCount = news.ViewCount,
            Tags = new List<string>(),
            CreatedTime = news.CreatedTime,
            UpdatedTime = news.UpdatedTime
        });
    }

    public async Task<Result<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var news = await _unitOfWork.News.GetByIdAsync(id, cancellationToken);
        if (news == null)
            return Result<bool>.Failure("新聞不存在");

        await _unitOfWork.News.DeleteAsync(news, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }

    public async Task<Result<NewsStatisticsDto>> GetStatisticsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var query = _unitOfWork.News.GetQueryable();
            var now = DateTime.UtcNow;
            var todayStart = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0, DateTimeKind.Utc);
            var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            var totalNews = await query.CountAsync(cancellationToken);
            var published = await query.CountAsync(n => n.Published, cancellationToken);
            var todayPublished = await query.CountAsync(n => n.Published && n.StartDate >= todayStart, cancellationToken);
            var thisMonthPublished = await query.CountAsync(n => n.Published && n.StartDate >= monthStart, cancellationToken);

            // 排程新聞：已設定開始日期且日期在未來的新聞
            var scheduled = await query.CountAsync(n => !n.Published && n.StartDate.HasValue && n.StartDate > now, cancellationToken);

            var statistics = new NewsStatisticsDto
            {
                TotalNews = totalNews,
                Published = published,
                Draft = totalNews - published,
                Scheduled = scheduled,
                TodayPublished = todayPublished,
                ThisMonthPublished = thisMonthPublished,
                TotalViews = await query.SumAsync(n => n.ViewCount, cancellationToken)
            };

            return Result<NewsStatisticsDto>.Success(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting news statistics");
            return Result<NewsStatisticsDto>.Failure($"獲取新聞統計失敗: {ex.Message}");
        }
    }

    public async Task<Result<int>> IncrementViewCountAsync(int id, CancellationToken cancellationToken = default)
    {
        var news = await _unitOfWork.News.GetByIdAsync(id, cancellationToken);
        if (news == null)
        {
            return Result<int>.Failure("新聞不存在");
        }

        news.ViewCount++;
        news.UpdatedTime = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<int>.Success(news.ViewCount);
    }
}
