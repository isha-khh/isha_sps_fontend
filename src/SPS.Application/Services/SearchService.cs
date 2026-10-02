using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Search;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;

namespace SPS.Application.Services;

/// <summary>
/// 全站搜尋。範圍只放前台真的有對應頁面、而且資料是從後端來的內容：公告（/news）、
/// 常見問題（/faq）、產業案例（/promotion）、影音（/promotion/video）。服務專區、
/// 人才培訓這幾頁前台目前是靜態資料，沒有後端內容可搜。
///
/// 比對方式跟各自既有的列表搜尋一致（標題／摘要等欄位 contains，不分大小寫），
/// 只回傳已發布的項目，草稿不會外洩。
/// </summary>
public class SearchService : ISearchService
{
    public const int MaxKeywordLength = 100;
    public const int MaxLimitPerGroup = 20;

    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<SearchService> _logger;

    public SearchService(IUnitOfWork unitOfWork, ILogger<SearchService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<SearchResponse>> SearchAsync(
        string keyword, int limitPerGroup, CancellationToken cancellationToken = default)
    {
        keyword = (keyword ?? string.Empty).Trim();
        if (keyword.Length == 0)
            return Result<SearchResponse>.Failure("請輸入搜尋關鍵字");
        if (keyword.Length > MaxKeywordLength)
            return Result<SearchResponse>.Failure($"搜尋關鍵字不能超過 {MaxKeywordLength} 個字元");

        var limit = Math.Clamp(limitPerGroup, 1, MaxLimitPerGroup);
        var kw = keyword.ToLower();
        var encoded = Uri.EscapeDataString(keyword);

        try
        {
            // 同一個 DbContext 不能同時跑多個查詢，所以依序執行
            var db = _unitOfWork.GetDbContext();
            var groups = new List<SearchGroup>
            {
                await SearchNewsAsync(db, kw, limit, encoded, cancellationToken),
                await SearchCasesAsync(db, kw, limit, encoded, cancellationToken),
                await SearchFaqAsync(db, kw, limit, encoded, cancellationToken),
                await SearchVideosAsync(db, kw, limit, encoded, cancellationToken),
            };

            return Result<SearchResponse>.Success(new SearchResponse
            {
                Keyword = keyword,
                TotalCount = groups.Sum(g => g.TotalCount),
                Groups = groups,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "全站搜尋失敗: {Keyword}", keyword);
            return Result<SearchResponse>.Failure("搜尋失敗，請稍後再試");
        }
    }

    private static async Task<SearchGroup> SearchNewsAsync(
        DbContext db, string kw, int limit, string encoded, CancellationToken ct)
    {
        var query = db.Set<News>().Where(n => n.Published &&
            ((n.Title != null && n.Title.DefaultText != null && n.Title.DefaultText.ToLower().Contains(kw)) ||
             (n.Introduction != null && n.Introduction.DefaultText != null && n.Introduction.DefaultText.ToLower().Contains(kw))));

        var total = await query.CountAsync(ct);
        var rows = await query
            .OrderByDescending(n => n.StartDate).ThenByDescending(n => n.Id)
            .Take(limit)
            .Select(n => new { n.Id, Title = n.Title!.DefaultText, Intro = n.Introduction != null ? n.Introduction.DefaultText : null, n.StartDate, Image = n.Picture != null ? n.Picture.DefaultImageUri : null })
            .ToListAsync(ct);

        return new SearchGroup
        {
            Type = "news",
            Label = "最新消息",
            TotalCount = total,
            MoreUrl = $"/news?q={encoded}",
            Items = rows.Select(r => new SearchResultItem
            {
                Id = r.Id.ToString(),
                Title = r.Title ?? string.Empty,
                Summary = r.Intro,
                Date = r.StartDate,
                ImageUrl = r.Image,
                Url = $"/news/{r.Id}",
            }).ToList(),
        };
    }

    private static async Task<SearchGroup> SearchCasesAsync(
        DbContext db, string kw, int limit, string encoded, CancellationToken ct)
    {
        var query = db.Set<SuccessCase>().Where(c => c.DataMode == DataMode.Normal && c.IsPublished &&
            ((c.Title != null && c.Title.DefaultText != null && c.Title.DefaultText.ToLower().Contains(kw)) ||
             c.CompanyName.ToLower().Contains(kw) ||
             c.Industry.ToLower().Contains(kw)));

        var total = await query.CountAsync(ct);
        var rows = await query
            .OrderByDescending(c => c.PublishedDate).ThenByDescending(c => c.Id)
            .Take(limit)
            .Select(c => new { c.Id, Title = c.Title != null ? c.Title.DefaultText : null, Summary = c.Summary != null ? c.Summary.DefaultText : null, c.PublishedDate, c.CoverImageUrl })
            .ToListAsync(ct);

        return new SearchGroup
        {
            Type = "case",
            Label = "產業案例",
            TotalCount = total,
            MoreUrl = $"/promotion?q={encoded}",
            Items = rows.Select(r => new SearchResultItem
            {
                Id = r.Id.ToString(),
                Title = r.Title ?? string.Empty,
                Summary = r.Summary,
                Date = r.PublishedDate,
                ImageUrl = r.CoverImageUrl,
                Url = $"/promotion/{r.Id}",
            }).ToList(),
        };
    }

    private static async Task<SearchGroup> SearchFaqAsync(
        DbContext db, string kw, int limit, string encoded, CancellationToken ct)
    {
        // 常見問題的答案是 Puck 區塊 JSON（不是純文字），搜尋時仍然比對答案內容，
        // 但摘要不回傳——JSON 直接顯示給使用者看沒有意義
        var query = db.Set<Question>().Where(q => q.Published &&
            ((q.Subject != null && q.Subject.DefaultText != null && q.Subject.DefaultText.ToLower().Contains(kw)) ||
             (q.Answer != null && q.Answer.DefaultText != null && q.Answer.DefaultText.ToLower().Contains(kw))));

        var total = await query.CountAsync(ct);
        var rows = await query
            .OrderBy(q => q.Ordinal).ThenBy(q => q.Id)
            .Take(limit)
            .Select(q => new { q.Id, Subject = q.Subject != null ? q.Subject.DefaultText : null })
            .ToListAsync(ct);

        return new SearchGroup
        {
            Type = "faq",
            Label = "常見問題",
            TotalCount = total,
            MoreUrl = $"/faq?q={encoded}",
            Items = rows.Select(r => new SearchResultItem
            {
                Id = r.Id.ToString(),
                Title = r.Subject ?? string.Empty,
                Url = $"/faq?q={encoded}",
            }).ToList(),
        };
    }

    private static async Task<SearchGroup> SearchVideosAsync(
        DbContext db, string kw, int limit, string encoded, CancellationToken ct)
    {
        var query = db.Set<Video>().Where(v => v.Published &&
            ((v.Name != null && v.Name.ToLower().Contains(kw)) ||
             (v.Remark != null && v.Remark.ToLower().Contains(kw))));

        var total = await query.CountAsync(ct);
        var rows = await query
            .OrderBy(v => v.Ordinal).ThenByDescending(v => v.Id)
            .Take(limit)
            .Select(v => new { v.Id, v.Name, v.Remark, v.StartDate, v.CreatedTime, v.ThumbnailUri })
            .ToListAsync(ct);

        return new SearchGroup
        {
            Type = "video",
            Label = "影音專區",
            TotalCount = total,
            MoreUrl = $"/promotion/video?q={encoded}",
            Items = rows.Select(r => new SearchResultItem
            {
                Id = r.Id.ToString(),
                Title = r.Name ?? string.Empty,
                Summary = r.Remark,
                Date = r.StartDate ?? r.CreatedTime,
                ImageUrl = r.ThumbnailUri,
                Url = $"/promotion/video?q={encoded}",
            }).ToList(),
        };
    }
}
