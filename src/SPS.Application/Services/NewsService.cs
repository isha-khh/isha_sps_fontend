using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.News;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;

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

        // 一次批次查完這一頁所有新聞的標簽，避免逐筆呼叫造成 N+1 查詢
        var tagsByNewsId = await _unitOfWork.News.GetNewsTagsBatchAsync(
            pagedResult.Items.Select(n => n.Id).ToList(), cancellationToken);

        var response = new PagedResult<NewsListItemResponse>
        {
            Items = pagedResult.Items.Select(n => new NewsListItemResponse
            {
                Id = n.Id,
                Title = n.Title?.DefaultText ?? string.Empty,
                Introduction = n.Introduction?.DefaultText,
                StartDate = n.StartDate,
                EndDate = n.EndDate,
                Published = n.Published,
                CategoryId = n.CategoryId,
                CategoryName = n.Category?.Name,
                ViewCount = n.ViewCount,
                CreatedTime = n.CreatedTime,
                Tags = tagsByNewsId.GetValueOrDefault(n.Id, new List<NewsTagItem>()).Select(t => t.Name).ToList(),
                TagItems = tagsByNewsId.GetValueOrDefault(n.Id, new List<NewsTagItem>()),
                ImageUrl = n.Picture?.DefaultImageUri
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
            Tags = tags.Select(t => t.Name).ToList(),
            TagItems = tags,
            CreatedTime = news.CreatedTime,
            UpdatedTime = news.UpdatedTime,
            ImageUrl = news.Picture?.DefaultImageUri,
            AttachmentFileIds = news.AttachmentFileIds,
            RelatedLinks = ReadLinks(news.RelatedLinksJson),
            ContactName = news.ContactName,
            ContactPhone = news.ContactPhone,
            ContactEmail = news.ContactEmail
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

            // 標籤只能綁「公告類型」且實際存在的標籤，先驗證再寫入，避免綁到不存在的 ID 才炸 FK
            var (tagIds, tagError) = await ResolveNewsTagIdsAsync(request.TagIds, cancellationToken);
            if (tagError != null)
                return Result<NewsResponse>.Failure(tagError);

            var (linksJson, linkError) = NormalizeLinks(request.RelatedLinks);
            if (linkError != null)
                return Result<NewsResponse>.Failure(linkError);

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
                AttachmentFileIds = request.AttachmentFileIds?.Distinct().ToList() ?? new List<Guid>(),
                RelatedLinksJson = string.IsNullOrEmpty(linksJson) ? null : linksJson,
                ContactName = NullIfBlank(request.ContactName),
                ContactPhone = NullIfBlank(request.ContactPhone),
                ContactEmail = NullIfBlank(request.ContactEmail),
                CreatedTime = DateTime.UtcNow,
                UpdatedTime = DateTime.UtcNow
            };

            await _unitOfWork.News.AddAsync(news, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            if (tagIds.Count > 0)
            {
                await _unitOfWork.Tags.ReplaceEntityTagsAsync(EntityType.News, news.Id.ToString(), tagIds, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }

            // 提交事務
            await transaction.CommitAsync(cancellationToken);
            var createdTags = await _unitOfWork.News.GetNewsTagsAsync(news.Id, cancellationToken);

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
                Tags = createdTags.Select(t => t.Name).ToList(),
                TagItems = createdTags,
                CreatedTime = news.CreatedTime,
                UpdatedTime = news.UpdatedTime,
                AttachmentFileIds = news.AttachmentFileIds,
                RelatedLinks = ReadLinks(news.RelatedLinksJson),
                ContactName = news.ContactName,
                ContactPhone = news.ContactPhone,
                ContactEmail = news.ContactEmail
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

        // TagIds 沒帶（null）= 不動標籤；帶空陣列 = 清空標籤
        List<int>? newTagIds = null;
        if (request.TagIds != null)
        {
            var (resolved, tagError) = await ResolveNewsTagIdsAsync(request.TagIds, cancellationToken);
            if (tagError != null)
                return Result<NewsResponse>.Failure(tagError);
            newTagIds = resolved;
        }

        var (newLinksJson, updateLinkError) = NormalizeLinks(request.RelatedLinks);
        if (updateLinkError != null)
            return Result<NewsResponse>.Failure(updateLinkError);

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
        if (request.AttachmentFileIds != null) news.AttachmentFileIds = request.AttachmentFileIds.Distinct().ToList();
        if (newLinksJson != null) news.RelatedLinksJson = newLinksJson.Length == 0 ? null : newLinksJson;
        if (request.ContactName != null) news.ContactName = NullIfBlank(request.ContactName);
        if (request.ContactPhone != null) news.ContactPhone = NullIfBlank(request.ContactPhone);
        if (request.ContactEmail != null) news.ContactEmail = NullIfBlank(request.ContactEmail);
        news.UpdatedTime = DateTime.UtcNow;

        await _unitOfWork.News.UpdateAsync(news, cancellationToken);
        if (newTagIds != null)
        {
            await _unitOfWork.Tags.ReplaceEntityTagsAsync(EntityType.News, news.Id.ToString(), newTagIds, cancellationToken);
        }
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        var updatedTags = await _unitOfWork.News.GetNewsTagsAsync(news.Id, cancellationToken);

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
            Tags = updatedTags.Select(t => t.Name).ToList(),
            TagItems = updatedTags,
            CreatedTime = news.CreatedTime,
            UpdatedTime = news.UpdatedTime,
            AttachmentFileIds = news.AttachmentFileIds,
            RelatedLinks = ReadLinks(news.RelatedLinksJson),
            ContactName = news.ContactName,
            ContactPhone = news.ContactPhone,
            ContactEmail = news.ContactEmail
        });
    }

    private const int MaxRelatedLinks = 10;
    private static readonly JsonSerializerOptions LinkJson = new(JsonSerializerDefaults.Web);

    private static List<NewsLinkItem> ReadLinks(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new List<NewsLinkItem>();
        try
        {
            return JsonSerializer.Deserialize<List<NewsLinkItem>>(json, LinkJson) ?? new List<NewsLinkItem>();
        }
        catch (JsonException)
        {
            return new List<NewsLinkItem>();
        }
    }

    /// <summary>整理並驗證相關連結：去掉全空的、標題與網址都要有、網址只接受 http／https、最多 10 筆</summary>
    private static (string? Json, string? Error) NormalizeLinks(List<NewsLinkItem>? links)
    {
        if (links == null) return (null, null);
        var cleaned = new List<NewsLinkItem>();
        foreach (var link in links)
        {
            var title = link.Title?.Trim() ?? string.Empty;
            var url = link.Url?.Trim() ?? string.Empty;
            if (title.Length == 0 && url.Length == 0) continue;
            if (title.Length == 0 || url.Length == 0) return (null, "相關連結的標題與網址都要填寫");
            if (title.Length > 100) return (null, "相關連結的標題最多 100 字");
            if (url.Length > 500) return (null, "相關連結的網址最多 500 字");
            if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
                return (null, $"相關連結「{title}」的網址必須是 http 或 https 開頭");
            cleaned.Add(new NewsLinkItem { Title = title, Url = url });
        }

        if (cleaned.Count > MaxRelatedLinks) return (null, $"相關連結最多 {MaxRelatedLinks} 筆");
        return (cleaned.Count == 0 ? string.Empty : JsonSerializer.Serialize(cleaned, LinkJson), null);
    }

    private static string? NullIfBlank(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    /// <summary>
    /// 驗證公告要綁的標籤：去重後必須全部是「公告類型」且實際存在的標籤。
    /// </summary>
    private async Task<(List<int> Ids, string? Error)> ResolveNewsTagIdsAsync(
        IEnumerable<int>? tagIds, CancellationToken cancellationToken)
    {
        var requested = (tagIds ?? Enumerable.Empty<int>()).Distinct().ToList();
        if (requested.Count == 0)
            return (requested, null);

        var existing = await _unitOfWork.Tags.GetExistingTagIdsAsync(requested, TagType.News, cancellationToken);
        var missing = requested.Except(existing).ToList();
        return missing.Count > 0
            ? (requested, $"標籤 ID {string.Join(", ", missing)} 不存在或不是公告標籤")
            : (requested, null);
    }

    public async Task<Result<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var news = await _unitOfWork.News.GetByIdAsync(id, cancellationToken);
        if (news == null)
            return Result<bool>.Failure("新聞不存在");

        // EntityTag 是多型關聯（EntityId 是字串、沒有 FK 連動刪除），不手動清掉會留下孤兒綁定，
        // 標籤的「使用中數量」也會一直算到已經刪掉的公告
        await _unitOfWork.Tags.ReplaceEntityTagsAsync(EntityType.News, news.Id.ToString(), Array.Empty<int>(), cancellationToken);
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
        // 草稿（未發布）前台看不到，也不該累計瀏覽數（後台預覽草稿不算）
        if (news == null || !news.Published)
        {
            return Result<int>.Failure("新聞不存在");
        }

        // 只動 ViewCount，不更新 UpdatedTime——那是「內容最後修改時間」，被讀者瀏覽就跳動會誤導
        news.ViewCount++;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<int>.Success(news.ViewCount);
    }
}
