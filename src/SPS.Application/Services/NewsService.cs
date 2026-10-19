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

        var categoryNames = await GetCategoryNamesAsync(pagedResult.Items.SelectMany(AllCategoryIds), cancellationToken);

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
                CategoryIds = AllCategoryIds(n).ToList(),
                CategoryNames = AllCategoryIds(n).Where(categoryNames.ContainsKey).Select(cid => categoryNames[cid]).ToList(),
                ViewCount = n.ViewCount,
                Type = n.Type,
                Section = n.Section,
                AttachmentCount = n.AttachmentFileIds.Count,
                Meta = n.Meta ?? new Dictionary<string, string>(),
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
        var detailCategoryIds = AllCategoryIds(news).ToList();
        var detailCategoryNames = await GetCategoryNamesAsync(detailCategoryIds, cancellationToken);

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
            CategoryIds = detailCategoryIds,
            CategoryNames = detailCategoryIds.Where(detailCategoryNames.ContainsKey).Select(cid => detailCategoryNames[cid]).ToList(),
            Type = news.Type,
            Section = news.Section,
            ViewCount = news.ViewCount,
            AttachmentFileIds = news.AttachmentFileIds,
            AttachmentCount = news.AttachmentFileIds.Count,
            Meta = news.Meta ?? new Dictionary<string, string>(),
            Tags = tags.Select(t => t.Name).ToList(),
            TagItems = tags,
            CreatedTime = news.CreatedTime,
            UpdatedTime = news.UpdatedTime,
            ImageUrl = news.Picture?.DefaultImageUri
        });
    }

    public async Task<Result<NewsResponse>> CreateAsync(
        CreateNewsRequest request, CancellationToken cancellationToken = default)
    {
        // 開始資料庫事務以確保原子性
        await using var transaction = await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            // 驗證分類是否存在（如果提供了的話）；CategoryIds 優先，沒帶才用單一的 CategoryId
            var (categoryIds, categoryError) = await ResolveCategoryIdsAsync(request.CategoryIds, request.CategoryId, cancellationToken);
            if (categoryError != null)
                return Result<NewsResponse>.Failure(categoryError);

            var (meta, metaError) = NormalizeMeta(request.Section, request.Meta);
            if (metaError != null)
                return Result<NewsResponse>.Failure(metaError);

            // 標籤只能綁「公告類型」且實際存在的標籤，先驗證再寫入，避免綁到不存在的 ID 才炸 FK
            var (tagIds, tagError) = await ResolveNewsTagIdsAsync(request.TagIds, cancellationToken);
            if (tagError != null)
                return Result<NewsResponse>.Failure(tagError);

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

            var coverImage = request.CoverFileId.HasValue ? await CreateCoverImageAsync(request.CoverFileId.Value, cancellationToken) : null;

            // 創建新聞實體
            var news = new News
            {
                PictureId = coverImage?.Id,
                TitleId = title.Id,
                IntroductionId = introduction?.Id,
                ContentId = content?.Id,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                Published = request.Published,
                Ordinal = request.Ordinal,
                CategoryId = categoryIds?.FirstOrDefault() is { } primary and > 0 ? primary : null,
                CategoryIds = categoryIds ?? new List<int>(),
                Type = request.Type,
                Section = request.Section,
                AttachmentFileIds = request.AttachmentFileIds?.Distinct().ToList() ?? new List<Guid>(),
                Meta = meta,
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
                CategoryIds = AllCategoryIds(news).ToList(),
                Type = news.Type,
                Section = news.Section,
                ViewCount = news.ViewCount,
                AttachmentFileIds = news.AttachmentFileIds,
                AttachmentCount = news.AttachmentFileIds.Count,
                Meta = news.Meta,
                Tags = createdTags.Select(t => t.Name).ToList(),
                TagItems = createdTags,
                CreatedTime = news.CreatedTime,
                UpdatedTime = news.UpdatedTime,
                ImageUrl = coverImage?.DefaultImageUri
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

        // 驗證分類是否存在；CategoryIds 優先（空陣列 = 清空），沒帶才看單一的 CategoryId，兩者都沒帶 = 不動
        var (newCategoryIds, categoryError) = await ResolveCategoryIdsAsync(request.CategoryIds, request.CategoryId, cancellationToken);
        if (categoryError != null)
            return Result<NewsResponse>.Failure(categoryError);

        // 專區改了、或有帶 Meta 時，都要重新檢查欄位名稱是否屬於（新的）專區
        var targetSection = request.Section ?? news.Section;
        if (request.Section.HasValue || request.Meta != null)
        {
            var (checkedMeta, metaError) = NormalizeMeta(targetSection, request.Meta ?? news.Meta);
            if (metaError != null)
                return Result<NewsResponse>.Failure(metaError);
            if (request.Meta != null) news.Meta = checkedMeta;
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
        if (newCategoryIds != null)
        {
            news.CategoryIds = newCategoryIds;
            news.CategoryId = newCategoryIds.Count > 0 ? newCategoryIds[0] : null;
            news.Category = null; // 主分類換了，別讓舊的導覽屬性蓋掉
        }
        if (request.Type.HasValue) news.Type = request.Type.Value;
        if (request.Section.HasValue) news.Section = request.Section.Value;
        if (request.AttachmentFileIds != null) news.AttachmentFileIds = request.AttachmentFileIds.Distinct().ToList();
        MultilingualImage? newCover = null;
        if (request.RemoveCover == true)
        {
            news.PictureId = null;
            news.Picture = null;
        }
        else if (request.CoverFileId.HasValue)
        {
            newCover = await CreateCoverImageAsync(request.CoverFileId.Value, cancellationToken);
            news.PictureId = newCover.Id;
            news.Picture = newCover;
        }

        news.UpdatedTime = DateTime.UtcNow;

        await _unitOfWork.News.UpdateAsync(news, cancellationToken);
        if (newTagIds != null)
        {
            await _unitOfWork.Tags.ReplaceEntityTagsAsync(EntityType.News, news.Id.ToString(), newTagIds, cancellationToken);
        }
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        var updatedTags = await _unitOfWork.News.GetNewsTagsAsync(news.Id, cancellationToken);
        var updatedCategoryNames = await GetCategoryNamesAsync(AllCategoryIds(news), cancellationToken);

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
            CategoryName = updatedCategoryNames.GetValueOrDefault(news.CategoryId ?? 0),
            CategoryIds = AllCategoryIds(news).ToList(),
            CategoryNames = AllCategoryIds(news).Where(updatedCategoryNames.ContainsKey).Select(cid => updatedCategoryNames[cid]).ToList(),
            Type = news.Type,
            Section = news.Section,
            ViewCount = news.ViewCount,
            AttachmentFileIds = news.AttachmentFileIds,
            AttachmentCount = news.AttachmentFileIds.Count,
            Meta = news.Meta ?? new Dictionary<string, string>(),
            Tags = updatedTags.Select(t => t.Name).ToList(),
            TagItems = updatedTags,
            CreatedTime = news.CreatedTime,
            UpdatedTime = news.UpdatedTime,
            ImageUrl = news.Picture?.DefaultImageUri
        });
    }

    /// <summary>這則內容的所有分類 Id：CategoryIds 優先；舊資料（尚未回填）退回單一的 CategoryId</summary>
    private static IEnumerable<int> AllCategoryIds(News news)
    {
        if (news.CategoryIds is { Count: > 0 }) return news.CategoryIds;
        return news.CategoryId.HasValue ? new[] { news.CategoryId.Value } : Array.Empty<int>();
    }

    /// <summary>
    /// 整理要寫入的分類：<paramref name="ids"/> 有帶就用（去重、保留順序），否則用單一的 <paramref name="single"/>；
    /// 兩者都沒帶回傳 null（建立時代表沒分類、更新時代表不動）。每個分類都要實際存在。
    /// </summary>
    private async Task<(List<int>? Ids, string? Error)> ResolveCategoryIdsAsync(List<int>? ids, int? single, CancellationToken cancellationToken)
    {
        var wanted = ids != null ? ids.Distinct().ToList() : single.HasValue ? new List<int> { single.Value } : null;
        if (wanted == null) return (null, null);
        foreach (var categoryId in wanted)
        {
            if (await _unitOfWork.Categories.GetByIdAsync(categoryId, cancellationToken) == null)
                return (null, $"分類 ID {categoryId} 不存在，請選擇有效的分類");
        }
        return (wanted, null);
    }

    private async Task<Dictionary<int, string>> GetCategoryNamesAsync(IEnumerable<int> ids, CancellationToken cancellationToken)
    {
        var wanted = ids.Distinct().ToList();
        if (wanted.Count == 0) return new Dictionary<int, string>();
        return await _unitOfWork.GetDbContext().Set<Category>()
            .Where(c => wanted.Contains(c.Id))
            .ToDictionaryAsync(c => c.Id, c => c.Name ?? string.Empty, cancellationToken);
    }

    /// <summary>封面圖：為檔案管理的檔案建立一筆新的圖片紀錄（每次都新建，不改既有的，避免動到別處共用的圖片）</summary>
    private async Task<MultilingualImage> CreateCoverImageAsync(Guid fileId, CancellationToken cancellationToken)
    {
        var db = _unitOfWork.GetDbContext();
        var image = new MultilingualImage { DefaultImageUri = $"/api/FileManagement/{fileId}/download" };
        db.Set<MultilingualImage>().Add(image);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return image;
    }

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

    private const int MaxMetaValueLength = 500;

    /// <summary>
    /// 檢查並整理專區專屬欄位：專區必須存在、欄位名稱必須在該專區允許的清單內、值去頭尾空白並丟掉空值、單一值不超過 500 字。
    /// 公告與服務專區沒有專屬欄位，帶了就拒絕。
    /// </summary>
    private static (Dictionary<string, string> Meta, string? Error) NormalizeMeta(short section, Dictionary<string, string>? meta)
    {
        if (!NewsSection.IsValid(section)) return (new Dictionary<string, string>(), $"不支援的專區：{section}");
        var result = new Dictionary<string, string>();
        if (meta == null || meta.Count == 0) return (result, null);

        var allowed = NewsSection.MetaKeys.GetValueOrDefault(section) ?? Array.Empty<string>();
        foreach (var (key, raw) in meta)
        {
            if (!allowed.Contains(key)) return (result, $"這個專區不支援欄位「{key}」");
            var value = (raw ?? string.Empty).Trim();
            if (value.Length == 0) continue;
            if (value.Length > MaxMetaValueLength) return (result, $"欄位「{key}」內容過長（上限 {MaxMetaValueLength} 字）");
            result[key] = value;
        }
        return (result, null);
    }
}
