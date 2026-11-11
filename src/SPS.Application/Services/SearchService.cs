using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Search;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;

namespace SPS.Application.Services;

/// <summary>
/// 全站搜尋，一次查這幾類前台有對應頁面的內容：最新消息、服務專區、人才培育課程、產業輔導、補助公告、
/// 政府補助資源、產業案例、常見問題、影音、企業名錄、媒合需求。
///
/// 比對方式（都不分大小寫、contains，沒有斷詞）：
/// <list type="bullet">
/// <item>公告類（News）：標題、簡介、<b>內文</b>；人才培育／產業輔導／政府補助資源另外比對專區欄位（<see cref="NewsMetaSearchKeys"/>，
/// 例如課程代號、開課單位、主辦／協辦／執行單位、上課地點）。內文與常見問題答案是 Puck 區塊 JSON，
/// 用 <see cref="RichTextMatcher"/> 只比對讀者看得到的文字，不會被 <c>type</c>、<c>props</c> 這類結構字誤中。</item>
/// <item>企業名錄：名稱、統編、英文名稱、標語、簡介（跟名錄列表的搜尋一致），只含已審核通過且啟用的企業，排序跟名錄列表一致（後台「企業名錄排序」）；
/// 後台「內容設定」打開「企業名錄只顯示供給端」時，需求端企業也不出現在這裡。</item>
/// <item>媒合需求：名稱、編號、公開摘要、地點。<b>不比對完整內容</b>——完整內容只有企業會員與後台看得到，
/// 搜尋給匿名訪客用，比對它會洩漏內容。</item>
/// </list>
/// 只回傳已發布（啟用）的項目，草稿、封存、已刪除不會外洩。
///
/// <b>語意搜尋</b>（後台「AI 語意搜尋」啟用後）：關鍵字比對完，再用 embedding 模型把搜尋詞轉成向量，
/// 跟已索引的公告類、常見問題、產業案例、企業（供給端）、需求公開欄位的向量比相似度，
/// 把「沒有出現關鍵字、但意思相關」的項目補在各分類關鍵字結果的後面（<see cref="SearchResultItem.MatchType"/> = semantic）。
/// 語意搜尋壞掉（沒啟用、模型連不上、逾時、頻率超過上限）一律靜默退回純關鍵字搜尋，不影響搜尋本身。
/// 搜尋詞向量依關鍵字快取，已索引的向量整份快取在記憶體；門檻在 appsettings 的 <c>Search:SemanticMinScore</c> 與
/// <c>Search:SemanticRelativeMargin</c>，可以不改程式碼調整。
/// </summary>
public class SearchService : ISearchService
{
    public const int MaxKeywordLength = 100;
    public const int MaxLimitPerGroup = 20;

    /// <summary>
    /// 內文要在記憶體裡驗證（見 <see cref="RichTextMatcher"/>），所以每個專區最多取最新的這麼多筆候選項目；
    /// 專區的已發布項目比這個多、而且關鍵字非常常見時，總筆數會少算（顯示的前幾筆仍然正確）。
    /// </summary>
    public const int MaxCandidatesPerGroup = 200;

    /// <summary>
    /// 各專區 <c>News.Meta</c> 裡要一起搜尋的欄位。刻意不含聯絡人、聯絡電話、報名連結、日期與排序（個資或搜了沒意義）。
    /// 公告（專區 0）、服務專區、補助公告沒有值得搜的欄位。
    /// </summary>
    internal static readonly IReadOnlyDictionary<short, string[]> NewsMetaSearchKeys = new Dictionary<short, string[]>
    {
        [NewsSection.Talent] = new[] { "organizer", "courseCode", "city", "audience", "location", "hostOrganizer", "coOrganizer", "executor", "fee" },
        [NewsSection.Tutoring] = new[] { "applicant", "organizer", "contributor" },
        [NewsSection.SupportResource] = new[] { "applicant", "amount", "organizer", "period" },
    };

    /// <summary>每分鐘最多向 embedding 服務查幾個「沒快取過的」搜尋詞；超過就這一分鐘不做語意搜尋（匿名端點的成本保護）</summary>
    private const int MaxQueryEmbeddingsPerMinute = 30;

    private const int SemanticMaxHitsPerType = 10;
    private const int SemanticMaxTotalHits = 40;
    private static readonly TimeSpan SemanticQueryTimeout = TimeSpan.FromSeconds(5);
    private const string VectorsCacheKey = "search:semantic-vectors";

    /// <summary>公告類各專區在搜尋結果裡的分組（順序即顯示順序）。政府補助資源是卡片列表、沒有單篇詳情頁，結果連到列表頁並帶上標題（一定找得到那一筆）</summary>
    private static readonly (short Section, string Type, string Label, string BasePath, bool HasDetailPage)[] NewsGroupDefs =
    {
        (NewsSection.Announcement, "news", "最新消息", "/news", true),
        (NewsSection.Serve, "serve", "服務專區", "/serve", true),
        (NewsSection.Talent, "talent", "人才培育", "/talent", true),
        (NewsSection.Tutoring, "tutoring", "產業輔導", "/tutoring", true),
        (NewsSection.Support, "support", "補助公告", "/support", true),
        (NewsSection.SupportResource, "support-resource", "政府補助資源", "/support/resources", false),
    };

    private readonly IUnitOfWork _unitOfWork;
    private readonly ISystemSettingService _settingService;
    private readonly IEmbeddingService _embeddingService;
    private readonly IMemoryCache _cache;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SearchService> _logger;

    public SearchService(
        IUnitOfWork unitOfWork,
        ISystemSettingService settingService,
        IEmbeddingService embeddingService,
        IMemoryCache cache,
        IConfiguration configuration,
        ILogger<SearchService> logger)
    {
        _unitOfWork = unitOfWork;
        _settingService = settingService;
        _embeddingService = embeddingService;
        _cache = cache;
        _configuration = configuration;
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
            var supplierOnly = await IsSupplierOnlyAsync();
            // 企業結果跟前台企業名錄用同一套排序（後台「頁面設定 → 企業名錄排序」）
            var companySortRules = await CompanyDirectoryOrdering.LoadEnabledRulesAsync(_settingService, cancellationToken);

            var groups = new List<SearchGroup>();
            foreach (var def in NewsGroupDefs)
                groups.Add(await SearchNewsAsync(db, kw, limit, encoded, cancellationToken, def.Section, def.Type, def.Label, def.BasePath, def.HasDetailPage));
            groups.Add(await SearchCompaniesAsync(db, kw, limit, encoded, supplierOnly, companySortRules, cancellationToken));
            groups.Add(await SearchDemandsAsync(db, kw, limit, encoded, cancellationToken));
            groups.Add(await SearchCasesAsync(db, kw, limit, encoded, cancellationToken));
            groups.Add(await SearchFaqAsync(db, kw, limit, encoded, cancellationToken));
            groups.Add(await SearchVideosAsync(db, kw, limit, encoded, cancellationToken));

            // 語意搜尋：把意思相關、但沒出現關鍵字的項目補進各分類；任何失敗都只記 log，維持純關鍵字結果
            await AppendSemanticAsync(db, groups, keyword, limit, supplierOnly, cancellationToken);

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

    /// <summary>候選項目：標題或簡介已經在資料庫比對到就不用載內文；沒比到但內文含關鍵字的才載內文，到記憶體驗證</summary>
    private sealed class NewsRow
    {
        public int Id { get; set; }
        public string? Title { get; set; }
        public string? Intro { get; set; }
        public DateTime? StartDate { get; set; }
        public string? Image { get; set; }
        public Dictionary<string, string>? Meta { get; set; }
        public bool TitleOrIntroHit { get; set; }
        public string? ContentToVerify { get; set; }
    }

    /// <summary>公告與各專區共用 News 資料表，用 <c>Section</c> 區分；各自一組搜尋結果，連結指向各自的頁面（<paramref name="basePath"/>）</summary>
    private static async Task<SearchGroup> SearchNewsAsync(
        DbContext db, string kw, int limit, string encoded, CancellationToken ct,
        short section, string groupType, string label, string basePath, bool hasDetailPage = true)
    {
        var metaKeys = NewsMetaSearchKeys.GetValueOrDefault(section) ?? Array.Empty<string>();
        var published = db.Set<News>().Where(n => n.Published && n.Section == section);

        // 有專區欄位要比對的專區（Meta 是 jsonb 字典，資料庫端沒辦法比對）：把已發布的項目都取回來在記憶體比；
        // 其他專區只取標題、簡介或內文含關鍵字的
        var candidates = metaKeys.Length > 0
            ? published
            : published.Where(n =>
                (n.Title != null && n.Title.DefaultText != null && n.Title.DefaultText.ToLower().Contains(kw)) ||
                (n.Introduction != null && n.Introduction.DefaultText != null && n.Introduction.DefaultText.ToLower().Contains(kw)) ||
                (n.Content != null && n.Content.DefaultText != null && n.Content.DefaultText.ToLower().Contains(kw)));

        var rows = await candidates
            .OrderByDescending(n => n.StartDate).ThenByDescending(n => n.Id)
            .Take(MaxCandidatesPerGroup)
            .Select(n => new NewsRow
            {
                Id = n.Id,
                Title = n.Title != null ? n.Title.DefaultText : null,
                Intro = n.Introduction != null ? n.Introduction.DefaultText : null,
                StartDate = n.StartDate,
                Image = n.Picture != null ? n.Picture.DefaultImageUri : null,
                Meta = n.Meta,
                TitleOrIntroHit =
                    (n.Title != null && n.Title.DefaultText != null && n.Title.DefaultText.ToLower().Contains(kw)) ||
                    (n.Introduction != null && n.Introduction.DefaultText != null && n.Introduction.DefaultText.ToLower().Contains(kw)),
                ContentToVerify =
                    !((n.Title != null && n.Title.DefaultText != null && n.Title.DefaultText.ToLower().Contains(kw)) ||
                      (n.Introduction != null && n.Introduction.DefaultText != null && n.Introduction.DefaultText.ToLower().Contains(kw)))
                    && n.Content != null && n.Content.DefaultText != null && n.Content.DefaultText.ToLower().Contains(kw)
                        ? n.Content.DefaultText
                        : null,
            })
            .ToListAsync(ct);

        var matched = rows
            .Where(r => r.TitleOrIntroHit
                || MetaContains(r.Meta, metaKeys, kw)
                || RichTextMatcher.Contains(r.ContentToVerify, kw))
            .ToList();

        return new SearchGroup
        {
            Type = groupType,
            Label = label,
            TotalCount = matched.Count,
            MoreUrl = $"{basePath}?q={encoded}",
            MatchedIds = matched.Select(r => r.Id.ToString()).ToHashSet(),
            Items = matched.Take(limit).Select(r => new SearchResultItem
            {
                Id = r.Id.ToString(),
                Title = r.Title ?? string.Empty,
                Summary = r.Intro,
                Date = r.StartDate,
                ImageUrl = r.Image,
                Url = hasDetailPage ? $"{basePath}/{r.Id}" : $"{basePath}?q={Uri.EscapeDataString(r.Title ?? string.Empty)}",
            }).ToList(),
        };
    }

    private static bool MetaContains(Dictionary<string, string>? meta, string[] keys, string kw)
    {
        if (meta == null || meta.Count == 0) return false;
        foreach (var key in keys)
        {
            if (meta.TryGetValue(key, out var value) && !string.IsNullOrEmpty(value) &&
                value.Contains(kw, StringComparison.OrdinalIgnoreCase))
                return true;
        }
        return false;
    }

    /// <summary>企業名錄：只含已審核通過且啟用的企業，比對欄位跟名錄列表的搜尋一致；後台打開「只顯示供給端」時需求端企業不列出</summary>
    private async Task<bool> IsSupplierOnlyAsync()
    {
        var content = await _settingService.GetSettingAsync<ContentSettingsDto>("Content");
        return content.IsSuccess && content.Data is { BusinessListSupplierOnly: true };
    }

    private static async Task<SearchGroup> SearchCompaniesAsync(
        DbContext db, string kw, int limit, string encoded, bool supplierOnly, List<EnterpriseSortRuleDto> sortRules, CancellationToken ct)
    {
        var query = db.Set<Company>().Where(c => c.DataMode == DataMode.Normal && c.IsVerified && c.Status == Status.Active &&
            (c.Name.ToLower().Contains(kw) ||
             c.Number.ToLower().Contains(kw) ||
             (c.EnglishName != null && c.EnglishName.ToLower().Contains(kw)) ||
             (c.Subject != null && c.Subject.ToLower().Contains(kw)) ||
             (c.Introduction != null && c.Introduction.ToLower().Contains(kw))));

        if (supplierOnly)
            query = query.Where(c => c.Type == CompanyType.Supplier || c.Type == CompanyType.Both);

        var total = await query.CountAsync(ct);
        var rows = await CompanyDirectoryOrdering.Apply(query, sortRules, db)
            .Take(limit)
            .Select(c => new { c.Id, c.Name, c.Subject })
            .ToListAsync(ct);

        return new SearchGroup
        {
            Type = "company",
            Label = "企業名錄",
            TotalCount = total,
            MoreUrl = $"/matching/enterprise?q={encoded}",
            MatchedIds = (await query.Select(c => c.Id.ToString()).Take(MaxCandidatesPerGroup).ToListAsync(ct)).ToHashSet(),
            Items = rows.Select(r => new SearchResultItem
            {
                Id = r.Id.ToString(),
                Title = r.Name,
                Summary = r.Subject,
                Url = $"/matching/enterprise/{r.Id}",
            }).ToList(),
        };
    }

    /// <summary>媒合需求：只含已上架的需求；比對名稱、編號、公開摘要、地點，不比對完整內容（那是企業會員才看得到的）</summary>
    private static async Task<SearchGroup> SearchDemandsAsync(
        DbContext db, string kw, int limit, string encoded, CancellationToken ct)
    {
        var query = db.Set<Demand>().Where(d => d.DataMode == DataMode.Normal && d.Status == Status.Active &&
            (d.Name.ToLower().Contains(kw) ||
             d.Number.ToLower().Contains(kw) ||
             (d.PublicSummary != null && d.PublicSummary.ToLower().Contains(kw)) ||
             (d.Location != null && d.Location.ToLower().Contains(kw))));

        var total = await query.CountAsync(ct);
        var rows = await query
            .OrderByDescending(d => d.PublishedTime ?? d.CreatedTime).ThenByDescending(d => d.Id)
            .Take(limit)
            .Select(d => new { d.Id, d.Name, d.PublicSummary, Date = d.PublishedTime ?? d.CreatedTime })
            .ToListAsync(ct);

        return new SearchGroup
        {
            Type = "demand",
            Label = "媒合需求",
            TotalCount = total,
            MoreUrl = $"/matching?q={encoded}",
            MatchedIds = (await query.Select(d => d.Id.ToString()).Take(MaxCandidatesPerGroup).ToListAsync(ct)).ToHashSet(),
            Items = rows.Select(r => new SearchResultItem
            {
                Id = r.Id.ToString(),
                Title = r.Name,
                Summary = r.PublicSummary,
                Date = r.Date,
                Url = $"/matching/{r.Id}",
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
            MatchedIds = (await query.Select(c => c.Id.ToString()).Take(MaxCandidatesPerGroup).ToListAsync(ct)).ToHashSet(),
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
        // 常見問題的答案是 Puck 區塊 JSON（不是純文字）：資料庫先篩出標題或答案含關鍵字的，
        // 答案再用 RichTextMatcher 只比對文字內容（不被 type、props 這類結構字誤中）；摘要不回傳——JSON 直接顯示給使用者看沒有意義
        var rows = await db.Set<Question>()
            .Where(q => q.Published &&
                ((q.Subject != null && q.Subject.DefaultText != null && q.Subject.DefaultText.ToLower().Contains(kw)) ||
                 (q.Answer != null && q.Answer.DefaultText != null && q.Answer.DefaultText.ToLower().Contains(kw))))
            .OrderBy(q => q.Ordinal).ThenBy(q => q.Id)
            .Take(MaxCandidatesPerGroup)
            .Select(q => new
            {
                q.Id,
                Subject = q.Subject != null ? q.Subject.DefaultText : null,
                SubjectHit = q.Subject != null && q.Subject.DefaultText != null && q.Subject.DefaultText.ToLower().Contains(kw),
                AnswerToVerify = !(q.Subject != null && q.Subject.DefaultText != null && q.Subject.DefaultText.ToLower().Contains(kw))
                    && q.Answer != null && q.Answer.DefaultText != null && q.Answer.DefaultText.ToLower().Contains(kw)
                        ? q.Answer.DefaultText
                        : null,
            })
            .ToListAsync(ct);

        var matched = rows.Where(r => r.SubjectHit || RichTextMatcher.Contains(r.AnswerToVerify, kw)).ToList();

        return new SearchGroup
        {
            Type = "faq",
            Label = "常見問題",
            TotalCount = matched.Count,
            MoreUrl = $"/faq?q={encoded}",
            MatchedIds = matched.Select(r => r.Id.ToString()).ToHashSet(),
            Items = matched.Take(limit).Select(r => new SearchResultItem
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

    // ==================== 語意搜尋 ====================

    private sealed record IndexedVector(EmbeddingSourceType Type, string Id, float[] Vector);

    private sealed record SemanticHit(EmbeddingSourceType Type, string Id, double Score);

    private sealed class QueryVectorEntry
    {
        public float[]? Vector { get; init; }
    }

    private async Task AppendSemanticAsync(
        DbContext db, List<SearchGroup> groups, string keyword, int limit, bool supplierOnly, CancellationToken ct)
    {
        try
        {
            var hits = await FindSemanticHitsAsync(db, keyword, ct);
            if (hits.Count == 0) return;

            var byType = hits.GroupBy(h => h.Type).ToDictionary(g => g.Key, g => g.ToList());
            var added = new Dictionary<string, int>();

            // 把一筆語意命中補進分類：關鍵字已經比對到的不重複；顯示筆數另外算（最多再顯示 limit 筆），總數照實加
            void Add(string groupType, string id, SearchResultItem item)
            {
                var group = groups.FirstOrDefault(g => g.Type == groupType);
                if (group == null || !group.MatchedIds.Add(id)) return;
                item.MatchType = "semantic";
                group.TotalCount++;
                if (added.GetValueOrDefault(groupType) < limit)
                {
                    group.Items.Add(item);
                    added[groupType] = added.GetValueOrDefault(groupType) + 1;
                }
            }

            if (byType.TryGetValue(EmbeddingSourceType.News, out var newsHits))
            {
                var ids = newsHits.Select(h => int.TryParse(h.Id, out var n) ? n : -1).Where(n => n > 0).ToList();
                var rows = (await db.Set<News>().Where(n => n.Published && ids.Contains(n.Id))
                        .Select(n => new
                        {
                            n.Id,
                            n.Section,
                            Title = n.Title != null ? n.Title.DefaultText : null,
                            Intro = n.Introduction != null ? n.Introduction.DefaultText : null,
                            n.StartDate,
                            Image = n.Picture != null ? n.Picture.DefaultImageUri : null,
                        })
                        .ToListAsync(ct))
                    .ToDictionary(r => r.Id);

                foreach (var hit in newsHits)
                {
                    if (!int.TryParse(hit.Id, out var id) || !rows.TryGetValue(id, out var r)) continue;
                    var def = NewsGroupDefs.FirstOrDefault(d => d.Section == r.Section);
                    if (def.Type == null) continue;
                    Add(def.Type, hit.Id, new SearchResultItem
                    {
                        Id = hit.Id,
                        Title = r.Title ?? string.Empty,
                        Summary = r.Intro,
                        Date = r.StartDate,
                        ImageUrl = r.Image,
                        Url = def.HasDetailPage ? $"{def.BasePath}/{r.Id}" : $"{def.BasePath}?q={Uri.EscapeDataString(r.Title ?? string.Empty)}",
                    });
                }
            }

            if (byType.TryGetValue(EmbeddingSourceType.Faq, out var faqHits))
            {
                var ids = faqHits.Select(h => int.TryParse(h.Id, out var n) ? n : -1).Where(n => n > 0).ToList();
                var rows = (await db.Set<Question>().Where(q => q.Published && ids.Contains(q.Id))
                        .Select(q => new { q.Id, Subject = q.Subject != null ? q.Subject.DefaultText : null })
                        .ToListAsync(ct))
                    .ToDictionary(r => r.Id);

                foreach (var hit in faqHits)
                {
                    if (!int.TryParse(hit.Id, out var id) || !rows.TryGetValue(id, out var r)) continue;
                    var title = r.Subject ?? string.Empty;
                    Add("faq", hit.Id, new SearchResultItem
                    {
                        Id = hit.Id,
                        Title = title,
                        Url = $"/faq?q={Uri.EscapeDataString(title)}",
                    });
                }
            }

            if (byType.TryGetValue(EmbeddingSourceType.Case, out var caseHits))
            {
                var ids = caseHits.Select(h => int.TryParse(h.Id, out var n) ? n : -1).Where(n => n > 0).ToList();
                var rows = (await db.Set<SuccessCase>().Where(c => c.DataMode == DataMode.Normal && c.IsPublished && ids.Contains(c.Id))
                        .Select(c => new
                        {
                            c.Id,
                            Title = c.Title != null ? c.Title.DefaultText : null,
                            Summary = c.Summary != null ? c.Summary.DefaultText : null,
                            c.PublishedDate,
                            c.CoverImageUrl,
                        })
                        .ToListAsync(ct))
                    .ToDictionary(r => r.Id);

                foreach (var hit in caseHits)
                {
                    if (!int.TryParse(hit.Id, out var id) || !rows.TryGetValue(id, out var r)) continue;
                    Add("case", hit.Id, new SearchResultItem
                    {
                        Id = hit.Id,
                        Title = r.Title ?? string.Empty,
                        Summary = r.Summary,
                        Date = r.PublishedDate,
                        ImageUrl = r.CoverImageUrl,
                        Url = $"/promotion/{r.Id}",
                    });
                }
            }

            if (byType.TryGetValue(EmbeddingSourceType.Company, out var companyHits))
            {
                var ids = companyHits.Select(h => Guid.TryParse(h.Id, out var g) ? g : Guid.Empty).Where(g => g != Guid.Empty).ToList();
                var query = db.Set<Company>().Where(c => c.DataMode == DataMode.Normal && c.IsVerified && c.Status == Status.Active && ids.Contains(c.Id));
                if (supplierOnly)
                    query = query.Where(c => c.Type == CompanyType.Supplier || c.Type == CompanyType.Both);
                var rows = (await query.Select(c => new { c.Id, c.Name, c.Subject }).ToListAsync(ct)).ToDictionary(r => r.Id.ToString());

                foreach (var hit in companyHits)
                {
                    if (!rows.TryGetValue(hit.Id.ToLowerInvariant(), out var r)) continue;
                    Add("company", hit.Id.ToLowerInvariant(), new SearchResultItem
                    {
                        Id = r.Id.ToString(),
                        Title = r.Name,
                        Summary = r.Subject,
                        Url = $"/matching/enterprise/{r.Id}",
                    });
                }
            }

            if (byType.TryGetValue(EmbeddingSourceType.DemandDocument, out var demandHits))
            {
                var ids = demandHits.Select(h => int.TryParse(h.Id, out var n) ? n : -1).Where(n => n > 0).ToList();
                var rows = (await db.Set<Demand>().Where(d => d.DataMode == DataMode.Normal && d.Status == Status.Active && ids.Contains(d.Id))
                        .Select(d => new { d.Id, d.Name, d.PublicSummary, Date = d.PublishedTime ?? d.CreatedTime })
                        .ToListAsync(ct))
                    .ToDictionary(r => r.Id);

                foreach (var hit in demandHits)
                {
                    if (!int.TryParse(hit.Id, out var id) || !rows.TryGetValue(id, out var r)) continue;
                    Add("demand", hit.Id, new SearchResultItem
                    {
                        Id = hit.Id,
                        Title = r.Name,
                        Summary = r.PublicSummary,
                        Date = r.Date,
                        Url = $"/matching/{r.Id}",
                    });
                }
            }
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "全站搜尋的語意搜尋失敗，改用純關鍵字結果：{Keyword}", keyword);
        }
    }

    /// <summary>算搜尋詞跟所有已索引向量的相似度，依門檻挑出命中的項目（由高到低）</summary>
    private async Task<List<SemanticHit>> FindSemanticHitsAsync(DbContext db, string keyword, CancellationToken ct)
    {
        var empty = new List<SemanticHit>();
        var query = await GetQueryVectorAsync(keyword, ct);
        if (query == null) return empty;

        var vectors = await GetSearchVectorsAsync(db, ct);
        if (vectors.Count == 0) return empty;

        var scored = new List<SemanticHit>(vectors.Count);
        foreach (var v in vectors)
        {
            if (v.Vector.Length != query.Length) continue; // 換模型換了維度、舊向量還沒重建完
            double dot = 0;
            for (var i = 0; i < query.Length; i++) dot += query[i] * v.Vector[i];
            scored.Add(new SemanticHit(v.Type, v.Id, dot));
        }
        if (scored.Count == 0) return empty;

        var minScore = _configuration.GetValue("Search:SemanticMinScore", 0.5);
        var margin = _configuration.GetValue("Search:SemanticRelativeMargin", 0.12);
        var best = scored.Max(h => h.Score);
        var cutoff = Math.Max(minScore, best - margin);

        var hits = scored
            .Where(h => h.Score >= cutoff)
            .OrderByDescending(h => h.Score)
            .GroupBy(h => h.Type)
            .SelectMany(g => g.Take(SemanticMaxHitsPerType))
            .OrderByDescending(h => h.Score)
            .Take(SemanticMaxTotalHits)
            .ToList();

        // 門檻要看實際分數才調得準，所以每次都記一筆
        _logger.LogInformation("語意搜尋「{Keyword}」：最高分 {Best:F3}，門檻 {Cutoff:F3}，命中 {Count} 筆（比對 {Total} 筆向量）",
            keyword, best, cutoff, hits.Count, scored.Count);
        return hits;
    }

    /// <summary>搜尋詞的查詢向量：依關鍵字快取（成功 1 小時、失敗 1 分鐘），沒快取過的每分鐘最多 <see cref="MaxQueryEmbeddingsPerMinute"/> 次，逾時 5 秒就放棄</summary>
    private async Task<float[]?> GetQueryVectorAsync(string keyword, CancellationToken ct)
    {
        var cacheKey = $"search:qv:{keyword.ToLowerInvariant()}";
        if (_cache.TryGetValue(cacheKey, out QueryVectorEntry? cached) && cached != null)
            return cached.Vector;

        var bucket = _cache.GetOrCreate($"search:qv-budget:{DateTime.UtcNow:yyyyMMddHHmm}", entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2);
            return new int[1];
        })!;
        if (Interlocked.Increment(ref bucket[0]) > MaxQueryEmbeddingsPerMinute)
        {
            _logger.LogWarning("語意搜尋的查詢向量頻率超過每分鐘 {Max} 次，這一分鐘改用純關鍵字搜尋", MaxQueryEmbeddingsPerMinute);
            return null;
        }

        float[]? vector = null;
        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(SemanticQueryTimeout);
            var result = await _embeddingService.EmbedSearchQueryAsync(keyword, cts.Token);
            if (result.IsSuccess && result.Data is { Length: > 0 })
                vector = Normalize(result.Data);
            else
                _logger.LogDebug("語意搜尋查詢向量取得失敗：{Error}", result.Error);
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            _logger.LogWarning("語意搜尋查詢向量逾時（{Seconds} 秒），改用純關鍵字搜尋", SemanticQueryTimeout.TotalSeconds);
        }

        _cache.Set(cacheKey, new QueryVectorEntry { Vector = vector }, vector != null ? TimeSpan.FromHours(1) : TimeSpan.FromMinutes(1));
        return vector;
    }

    /// <summary>已索引的內容向量（目前模型、全站搜尋涵蓋的來源類型），預先正規化成單位向量，整份快取 5 分鐘</summary>
    private async Task<IReadOnlyList<IndexedVector>> GetSearchVectorsAsync(DbContext db, CancellationToken ct)
    {
        if (_cache.TryGetValue(VectorsCacheKey, out IReadOnlyList<IndexedVector>? cached) && cached != null)
            return cached;

        var model = await _embeddingService.GetActiveModelNameAsync(ct);
        if (string.IsNullOrWhiteSpace(model)) return Array.Empty<IndexedVector>();

        var types = new[]
        {
            EmbeddingSourceType.News, EmbeddingSourceType.Faq, EmbeddingSourceType.Case,
            EmbeddingSourceType.Company, EmbeddingSourceType.DemandDocument,
        };
        var rows = await db.Set<ContentEmbedding>().AsNoTracking()
            .Where(e => types.Contains(e.SourceType) && e.Status == EmbeddingStatus.Indexed && e.Embedding != null && e.Model == model)
            .Select(e => new { e.SourceType, e.SourceId, e.Embedding })
            .ToListAsync(ct);

        var list = rows
            .Select(r => new IndexedVector(r.SourceType, r.SourceId, Normalize(r.Embedding!)))
            .ToList();
        _cache.Set(VectorsCacheKey, (IReadOnlyList<IndexedVector>)list, TimeSpan.FromMinutes(5));
        return list;
    }

    private static float[] Normalize(float[] v)
    {
        double sum = 0;
        foreach (var x in v) sum += x * x;
        var norm = Math.Sqrt(sum);
        if (norm == 0) return v;
        var result = new float[v.Length];
        for (var i = 0; i < v.Length; i++) result[i] = (float)(v[i] / norm);
        return result;
    }
}
