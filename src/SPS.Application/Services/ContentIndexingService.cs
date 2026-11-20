using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;

namespace SPS.Application.Services;

/// <summary>
/// 實作見 IContentIndexingService。詳見 docs/設計/AI向量媒合搜尋設計.md §3、§4。
/// </summary>
public class ContentIndexingService : IContentIndexingService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IEmbeddingService _embeddingService;
    private readonly ILogger<ContentIndexingService> _logger;

    private const int MaxRetryCount = 5;

    public ContentIndexingService(
        IUnitOfWork unitOfWork,
        IEmbeddingService embeddingService,
        ILogger<ContentIndexingService> logger)
    {
        _unitOfWork = unitOfWork;
        _embeddingService = embeddingService;
        _logger = logger;
    }

    public async Task<bool> IndexDemandAsync(int demandId, CancellationToken ct = default, bool force = false)
    {
        var db = _unitOfWork.GetDbContext();

        var demand = await db.Set<Demand>().AsNoTracking().FirstOrDefaultAsync(d => d.Id == demandId, ct);
        if (demand == null) return false;

        var tagNames = await GetTagNamesAsync(db, demandTagsForDemandId: demandId, companyTagsForCompanyId: null, ct);
        var text = BuildSourceText(demand.Name, demand.Description, tagNames);

        // Demand 存的是「查詢端」向量（含 instruction prefix），因為目前唯一的搜尋方向是
        // 「以 Demand 找 Company」（Demand 扮演查詢角色）。§2.2.2 已驗證 instruction prefix
        // 對這個方向有效；CSLS 偏誤修正（§5.4）的基準集合也是用同一種向量算的，兩邊要一致。
        // 若日後要做「以 Company 找 Demand」的反向搜尋，屆時 Demand 需要另外存一份不含
        // instruction 的「文件端」向量，是獨立的待辦（見 §7）。
        return await UpsertAsync(EmbeddingSourceType.Demand, demandId.ToString(), text, useQueryStyle: true, force, ct);
    }

    public async Task<bool> IndexCompanyAsync(Guid companyId, CancellationToken ct = default, bool force = false)
    {
        var db = _unitOfWork.GetDbContext();

        var company = await db.Set<Company>().AsNoTracking().FirstOrDefaultAsync(c => c.Id == companyId, ct);
        if (company == null) return false;

        var tagNames = await GetTagNamesAsync(db, demandTagsForDemandId: null, companyTagsForCompanyId: companyId, ct);
        var text = BuildSourceText(company.Subject, company.Introduction, tagNames);

        // Company 存的是「文件端」向量（不含 instruction），是被檢索的一方，符合不對稱檢索慣例
        return await UpsertAsync(EmbeddingSourceType.Company, companyId.ToString(), text, useQueryStyle: false, force, ct);
    }

    /// <summary>語意索引文字的長度上限（字元）；內文很長的公告只取前面這一段，足以代表主題</summary>
    private const int MaxIndexChars = 2000;

    public async Task<bool> IndexNewsAsync(int newsId, CancellationToken ct = default, bool force = false)
    {
        var db = _unitOfWork.GetDbContext();
        var news = await db.Set<News>().AsNoTracking()
            .Include(n => n.Title).Include(n => n.Introduction).Include(n => n.Content)
            .FirstOrDefaultAsync(n => n.Id == newsId, ct);
        if (news == null) return false;

        var parts = new List<string>
        {
            $"【{SectionLabel(news.Section)}】",
            news.Title?.DefaultText ?? string.Empty,
            news.Introduction?.DefaultText ?? string.Empty,
        };
        // 專區欄位（課程代號、開課單位、主辦／協辦／執行單位、上課地點…）也是讀者會搜的詞
        if (SearchService.NewsMetaSearchKeys.TryGetValue(news.Section, out var metaKeys))
            parts.AddRange(metaKeys.Select(k => news.Meta.GetValueOrDefault(k) ?? string.Empty));
        parts.Add(RichTextMatcher.ExtractText(news.Content?.DefaultText, MaxIndexChars));

        return await UpsertAsync(EmbeddingSourceType.News, newsId.ToString(), BuildIndexText(parts), useQueryStyle: false, force, ct);
    }

    public async Task<bool> IndexFaqAsync(int questionId, CancellationToken ct = default, bool force = false)
    {
        var db = _unitOfWork.GetDbContext();
        var question = await db.Set<Question>().AsNoTracking()
            .Include(q => q.Subject).Include(q => q.Answer)
            .FirstOrDefaultAsync(q => q.Id == questionId, ct);
        if (question == null) return false;

        var text = BuildIndexText(new[] { "【常見問題】", question.Subject?.DefaultText ?? string.Empty, RichTextMatcher.ExtractText(question.Answer?.DefaultText, MaxIndexChars) });
        return await UpsertAsync(EmbeddingSourceType.Faq, questionId.ToString(), text, useQueryStyle: false, force, ct);
    }

    public async Task<bool> IndexCaseAsync(int caseId, CancellationToken ct = default, bool force = false)
    {
        var db = _unitOfWork.GetDbContext();
        var successCase = await db.Set<SuccessCase>().AsNoTracking()
            .Include(c => c.Title).Include(c => c.Summary).Include(c => c.Content)
            .FirstOrDefaultAsync(c => c.Id == caseId, ct);
        if (successCase == null) return false;

        var text = BuildIndexText(new[]
        {
            "【產業案例】",
            successCase.Title?.DefaultText ?? string.Empty,
            successCase.CompanyName,
            successCase.Industry,
            successCase.Summary?.DefaultText ?? string.Empty,
            successCase.Tags ?? string.Empty,
            RichTextMatcher.ExtractText(successCase.Content?.DefaultText, MaxIndexChars),
        });
        return await UpsertAsync(EmbeddingSourceType.Case, caseId.ToString(), text, useQueryStyle: false, force, ct);
    }

    /// <summary>
    /// 需求的文件端向量：<b>只放公開欄位</b>（名稱、公開摘要、地點、標籤）。完整內容只有企業會員與後台看得到，
    /// 全站搜尋是給匿名訪客用的，不能把它拿去比對。
    /// </summary>
    public async Task<bool> IndexDemandDocumentAsync(int demandId, CancellationToken ct = default, bool force = false)
    {
        var db = _unitOfWork.GetDbContext();
        var demand = await db.Set<Demand>().AsNoTracking().FirstOrDefaultAsync(d => d.Id == demandId, ct);
        if (demand == null) return false;

        var tagNames = await GetTagNamesAsync(db, demandTagsForDemandId: demandId, companyTagsForCompanyId: null, ct);
        var text = BuildIndexText(new[] { "【媒合需求】", demand.Name, demand.PublicSummary ?? string.Empty, demand.Location ?? string.Empty, string.Join(" ", tagNames) });
        return await UpsertAsync(EmbeddingSourceType.DemandDocument, demandId.ToString(), text, useQueryStyle: false, force, ct);
    }

    public async Task<bool> IndexAsync(EmbeddingSourceType sourceType, string sourceId, CancellationToken ct = default, bool force = false)
    {
        switch (sourceType)
        {
            case EmbeddingSourceType.Demand:
                return int.TryParse(sourceId, out var demandId) && await IndexDemandAsync(demandId, ct, force);
            case EmbeddingSourceType.Company:
                return Guid.TryParse(sourceId, out var companyId) && await IndexCompanyAsync(companyId, ct, force);
            case EmbeddingSourceType.News:
                return int.TryParse(sourceId, out var newsId) && await IndexNewsAsync(newsId, ct, force);
            case EmbeddingSourceType.Faq:
                return int.TryParse(sourceId, out var faqId) && await IndexFaqAsync(faqId, ct, force);
            case EmbeddingSourceType.Case:
                return int.TryParse(sourceId, out var caseId) && await IndexCaseAsync(caseId, ct, force);
            case EmbeddingSourceType.DemandDocument:
                return int.TryParse(sourceId, out var docDemandId) && await IndexDemandDocumentAsync(docDemandId, ct, force);
            default:
                return false;
        }
    }

    private static string SectionLabel(short section) => section switch
    {
        NewsSection.Announcement => "最新消息",
        NewsSection.Serve => "服務專區",
        NewsSection.Support => "補助公告",
        NewsSection.Talent => "人才培育課程",
        NewsSection.Tutoring => "產業輔導",
        NewsSection.SupportResource => "政府補助資源",
        _ => "公告",
    };

    private static string BuildIndexText(IEnumerable<string> parts)
    {
        var text = string.Join("\n", parts.Where(p => !string.IsNullOrWhiteSpace(p)).Select(p => p.Trim()));
        return text.Length > MaxIndexChars ? text[..MaxIndexChars] : text;
    }

    /// <summary>全站搜尋語意索引涵蓋的來源類型（排程補漏與全量重新索引用）</summary>
    private static readonly EmbeddingSourceType[] SearchSourceTypes =
    {
        EmbeddingSourceType.News, EmbeddingSourceType.Faq, EmbeddingSourceType.Case, EmbeddingSourceType.DemandDocument,
    };

    private static IQueryable<string> AllSourceIds(Microsoft.EntityFrameworkCore.DbContext db, EmbeddingSourceType type) => type switch
    {
        EmbeddingSourceType.News => db.Set<News>().Select(n => n.Id.ToString()),
        EmbeddingSourceType.Faq => db.Set<Question>().Select(q => q.Id.ToString()),
        EmbeddingSourceType.Case => db.Set<SuccessCase>().Select(c => c.Id.ToString()),
        EmbeddingSourceType.DemandDocument => db.Set<Demand>().Select(d => d.Id.ToString()),
        _ => Enumerable.Empty<string>().AsQueryable(),
    };

    /// <summary>某個來源類型的排程補漏：先補完全沒有向量的，再重試失敗的。回傳處理筆數</summary>
    private async Task<int> ReconcileTypeAsync(EmbeddingSourceType type, int limit, CancellationToken ct)
    {
        if (limit <= 0) return 0;
        var db = _unitOfWork.GetDbContext();
        var processed = 0;

        var missing = await AllSourceIds(db, type)
            .Where(id => !db.Set<ContentEmbedding>().Any(e => e.SourceType == type && e.SourceId == id))
            .Take(limit)
            .ToListAsync(ct);
        foreach (var id in missing)
        {
            await IndexAsync(type, id, ct);
            processed++;
        }

        if (processed < limit)
        {
            var failed = await db.Set<ContentEmbedding>()
                .Where(e => e.SourceType == type && e.Status == EmbeddingStatus.Failed && e.RetryCount < MaxRetryCount)
                .OrderBy(e => e.UpdatedTime)
                .Select(e => e.SourceId)
                .Take(limit - processed)
                .ToListAsync(ct);
            foreach (var id in failed)
            {
                await IndexAsync(type, id, ct);
                processed++;
            }
        }

        return processed;
    }

    public async Task<int> ReconcileBatchAsync(int batchSize, CancellationToken ct = default)
    {
        var db = _unitOfWork.GetDbContext();
        var processed = 0;

        // 1. Demand：完全沒有 embedding 記錄的（新增/漏觸發）
        var demandIds = await db.Set<Demand>()
            .Where(d => !db.Set<ContentEmbedding>().Any(e => e.SourceType == EmbeddingSourceType.Demand && e.SourceId == d.Id.ToString()))
            .OrderBy(d => d.Id)
            .Select(d => d.Id)
            .Take(batchSize)
            .ToListAsync(ct);

        foreach (var id in demandIds)
        {
            await IndexDemandAsync(id, ct);
            processed++;
        }

        // 2. Demand：hash 對不上或失敗待重試的
        if (processed < batchSize)
        {
            var remaining = batchSize - processed;
            var staleDemandIds = await db.Set<ContentEmbedding>()
                .Where(e => e.SourceType == EmbeddingSourceType.Demand
                            && (e.Status == EmbeddingStatus.Failed && e.RetryCount < MaxRetryCount))
                .OrderBy(e => e.UpdatedTime)
                .Select(e => e.SourceId)
                .Take(remaining)
                .ToListAsync(ct);

            foreach (var idStr in staleDemandIds)
            {
                if (int.TryParse(idStr, out var id))
                {
                    await IndexDemandAsync(id, ct);
                    processed++;
                }
            }
        }

        // 3. Company：完全沒有 embedding 記錄的
        if (processed < batchSize)
        {
            var remaining = batchSize - processed;
            var companyIds = await db.Set<Company>()
                .Where(c => (c.Type == CompanyType.Supplier || c.Type == CompanyType.Both)
                            && !db.Set<ContentEmbedding>().Any(e => e.SourceType == EmbeddingSourceType.Company && e.SourceId == c.Id.ToString()))
                .OrderBy(c => c.Id)
                .Select(c => c.Id)
                .Take(remaining)
                .ToListAsync(ct);

            foreach (var id in companyIds)
            {
                await IndexCompanyAsync(id, ct);
                processed++;
            }
        }

        // 4. Company：失敗待重試的
        if (processed < batchSize)
        {
            var remaining = batchSize - processed;
            var staleCompanyIds = await db.Set<ContentEmbedding>()
                .Where(e => e.SourceType == EmbeddingSourceType.Company
                            && e.Status == EmbeddingStatus.Failed && e.RetryCount < MaxRetryCount)
                .OrderBy(e => e.UpdatedTime)
                .Select(e => e.SourceId)
                .Take(remaining)
                .ToListAsync(ct);

            foreach (var idStr in staleCompanyIds)
            {
                if (Guid.TryParse(idStr, out var id))
                {
                    await IndexCompanyAsync(id, ct);
                    processed++;
                }
            }
        }

        // 5. 全站搜尋語意索引：公告類、常見問題、產業案例、需求公開欄位
        foreach (var type in SearchSourceTypes)
            processed += await ReconcileTypeAsync(type, batchSize - processed, ct);

        return processed;
    }

    private async Task<bool> UpsertAsync(EmbeddingSourceType sourceType, string sourceId, string text, bool useQueryStyle, bool force, CancellationToken ct)
    {
        var db = _unitOfWork.GetDbContext();
        var hash = ComputeHash(text);

        var existing = await db.Set<ContentEmbedding>()
            .FirstOrDefaultAsync(e => e.SourceType == sourceType && e.SourceId == sourceId, ct);

        if (!force && existing != null && existing.SourceTextHash == hash && existing.Status == EmbeddingStatus.Indexed)
            return true; // 內容沒變動且已成功索引過，跳過

        var embedResult = useQueryStyle
            ? await _embeddingService.EmbedQueryAsync(text, ct)
            : await _embeddingService.EmbedDocumentAsync(text, ct);

        if (existing == null)
        {
            existing = new ContentEmbedding { SourceType = sourceType, SourceId = sourceId };
            await db.Set<ContentEmbedding>().AddAsync(existing, ct);
        }

        existing.SourceTextHash = hash;
        existing.UpdatedTime = DateTime.UtcNow;

        if (embedResult.IsSuccess)
        {
            existing.Embedding = embedResult.Data;
            existing.Dimension = embedResult.Data!.Length;
            existing.Model = await _embeddingService.GetActiveModelNameAsync(ct) ?? "unknown";
            existing.Status = EmbeddingStatus.Indexed;
            existing.RetryCount = 0;
            existing.LastError = null;
        }
        else
        {
            existing.Status = EmbeddingStatus.Failed;
            existing.RetryCount += 1;
            existing.LastError = embedResult.Error;
            _logger.LogWarning("索引 {SourceType} {SourceId} 失敗：{Error}", sourceType, sourceId, embedResult.Error);
        }

        await db.SaveChangesAsync(ct);
        return embedResult.IsSuccess;
    }

    public async Task<int> ResetFailedRetryCountsAsync(CancellationToken ct = default)
    {
        var db = _unitOfWork.GetDbContext();
        return await db.Set<ContentEmbedding>()
            .Where(e => e.Status == EmbeddingStatus.Failed && e.RetryCount > 0)
            .ExecuteUpdateAsync(setters => setters.SetProperty(e => e.RetryCount, 0), ct);
    }

    public async Task<IReadOnlyList<ReindexTarget>> ListReindexTargetsAsync(CancellationToken ct = default)
    {
        var db = _unitOfWork.GetDbContext();

        var demandIds = await db.Set<Demand>().AsNoTracking().OrderBy(d => d.Id).Select(d => d.Id).ToListAsync(ct);
        var companyIds = await db.Set<Company>().AsNoTracking()
            .Where(c => c.Type == CompanyType.Supplier || c.Type == CompanyType.Both)
            .OrderBy(c => c.Id)
            .Select(c => c.Id)
            .ToListAsync(ct);

        var targets = new List<ReindexTarget>(demandIds.Count + companyIds.Count);
        targets.AddRange(demandIds.Select(id => new ReindexTarget(EmbeddingSourceType.Demand, id.ToString())));
        targets.AddRange(companyIds.Select(id => new ReindexTarget(EmbeddingSourceType.Company, id.ToString())));
        foreach (var type in SearchSourceTypes)
        {
            var ids = await AllSourceIds(db, type).ToListAsync(ct);
            targets.AddRange(ids.Select(id => new ReindexTarget(type, id)));
        }
        return targets;
    }

    public async Task<EmbeddingIndexCountsDto> GetIndexCountsAsync(string? activeModel, CancellationToken ct = default)
    {
        var db = _unitOfWork.GetDbContext();
        var embeddings = db.Set<ContentEmbedding>().AsNoTracking();

        var demandTotal = await db.Set<Demand>().CountAsync(ct);
        var demandIndexed = await db.Set<Demand>().CountAsync(d => embeddings.Any(e =>
            e.SourceType == EmbeddingSourceType.Demand && e.SourceId == d.Id.ToString() && e.Status == EmbeddingStatus.Indexed), ct);
        var demandFailed = await db.Set<Demand>().CountAsync(d => embeddings.Any(e =>
            e.SourceType == EmbeddingSourceType.Demand && e.SourceId == d.Id.ToString() && e.Status == EmbeddingStatus.Failed), ct);

        var suppliers = db.Set<Company>().AsNoTracking().Where(c => c.Type == CompanyType.Supplier || c.Type == CompanyType.Both);
        var companyTotal = await suppliers.CountAsync(ct);
        var companyIndexed = await suppliers.CountAsync(c => embeddings.Any(e =>
            e.SourceType == EmbeddingSourceType.Company && e.SourceId == c.Id.ToString() && e.Status == EmbeddingStatus.Indexed), ct);
        var companyFailed = await suppliers.CountAsync(c => embeddings.Any(e =>
            e.SourceType == EmbeddingSourceType.Company && e.SourceId == c.Id.ToString() && e.Status == EmbeddingStatus.Failed), ct);

        var failedExhausted = await embeddings.CountAsync(e => e.Status == EmbeddingStatus.Failed && e.RetryCount >= MaxRetryCount, ct);

        var otherModel = string.IsNullOrWhiteSpace(activeModel)
            ? 0
            : await embeddings.CountAsync(e => e.Status == EmbeddingStatus.Indexed && e.Model != activeModel, ct);

        var lastIndexedAt = await embeddings
            .Where(e => e.Status == EmbeddingStatus.Indexed)
            .MaxAsync(e => (DateTime?)e.UpdatedTime, ct);

        var lastError = await embeddings
            .Where(e => e.Status == EmbeddingStatus.Failed && e.LastError != null)
            .OrderByDescending(e => e.UpdatedTime)
            .Select(e => e.LastError)
            .FirstOrDefaultAsync(ct);

        return new EmbeddingIndexCountsDto
        {
            Demand = new EmbeddingSourceCountsDto
            {
                Total = demandTotal,
                Indexed = demandIndexed,
                Failed = demandFailed,
                Pending = Math.Max(0, demandTotal - demandIndexed - demandFailed),
            },
            Company = new EmbeddingSourceCountsDto
            {
                Total = companyTotal,
                Indexed = companyIndexed,
                Failed = companyFailed,
                Pending = Math.Max(0, companyTotal - companyIndexed - companyFailed),
            },
            FailedExhausted = failedExhausted,
            OtherModelCount = otherModel,
            LastIndexedAt = lastIndexedAt,
            LastError = lastError,
        };
    }

    private static async Task<List<string>> GetTagNamesAsync(
        Microsoft.EntityFrameworkCore.DbContext db,
        int? demandTagsForDemandId,
        Guid? companyTagsForCompanyId,
        CancellationToken ct)
    {
        List<int> categoryIds;
        if (demandTagsForDemandId.HasValue)
        {
            categoryIds = await db.Set<DemandTagCategory>()
                .Where(dtc => dtc.DemandId == demandTagsForDemandId.Value)
                .Select(dtc => dtc.CategoryId)
                .ToListAsync(ct);
        }
        else if (companyTagsForCompanyId.HasValue)
        {
            categoryIds = await db.Set<CompanyTagCategory>()
                .Where(ctc => ctc.CompanyId == companyTagsForCompanyId.Value)
                .Select(ctc => ctc.CategoryId)
                .ToListAsync(ct);
        }
        else
        {
            return new List<string>();
        }

        if (categoryIds.Count == 0) return new List<string>();

        return await db.Set<Category>()
            .Where(c => categoryIds.Contains(c.Id) && c.Name != null)
            .Select(c => c.Name!)
            .ToListAsync(ct);
    }

    private static string BuildSourceText(string? title, string? description, List<string> tagNames)
    {
        var parts = new List<string>();
        if (!string.IsNullOrWhiteSpace(title)) parts.Add(title);
        if (!string.IsNullOrWhiteSpace(description)) parts.Add(description);
        if (tagNames.Count > 0) parts.Add(string.Join(" ", tagNames));
        return string.Join(" ", parts);
    }

    private static string ComputeHash(string text)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(text));
        return Convert.ToHexString(bytes);
    }
}
