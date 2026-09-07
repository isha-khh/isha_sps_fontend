using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
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

    public async Task IndexDemandAsync(int demandId, CancellationToken ct = default)
    {
        var db = _unitOfWork.GetDbContext();

        var demand = await db.Set<Demand>().AsNoTracking().FirstOrDefaultAsync(d => d.Id == demandId, ct);
        if (demand == null) return;

        var tagNames = await GetTagNamesAsync(db, demandTagsForDemandId: demandId, companyTagsForCompanyId: null, ct);
        var text = BuildSourceText(demand.Name, demand.Description, tagNames);

        // Demand 存的是「查詢端」向量（含 instruction prefix），因為目前唯一的搜尋方向是
        // 「以 Demand 找 Company」（Demand 扮演查詢角色）。§2.2.2 已驗證 instruction prefix
        // 對這個方向有效；CSLS 偏誤修正（§5.4）的基準集合也是用同一種向量算的，兩邊要一致。
        // 若日後要做「以 Company 找 Demand」的反向搜尋，屆時 Demand 需要另外存一份不含
        // instruction 的「文件端」向量，是獨立的待辦（見 §7）。
        await UpsertAsync(EmbeddingSourceType.Demand, demandId.ToString(), text, useQueryStyle: true, ct);
    }

    public async Task IndexCompanyAsync(Guid companyId, CancellationToken ct = default)
    {
        var db = _unitOfWork.GetDbContext();

        var company = await db.Set<Company>().AsNoTracking().FirstOrDefaultAsync(c => c.Id == companyId, ct);
        if (company == null) return;

        var tagNames = await GetTagNamesAsync(db, demandTagsForDemandId: null, companyTagsForCompanyId: companyId, ct);
        var text = BuildSourceText(company.Subject, company.Introduction, tagNames);

        // Company 存的是「文件端」向量（不含 instruction），是被檢索的一方，符合不對稱檢索慣例
        await UpsertAsync(EmbeddingSourceType.Company, companyId.ToString(), text, useQueryStyle: false, ct);
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

        return processed;
    }

    private async Task UpsertAsync(EmbeddingSourceType sourceType, string sourceId, string text, bool useQueryStyle, CancellationToken ct)
    {
        var db = _unitOfWork.GetDbContext();
        var hash = ComputeHash(text);

        var existing = await db.Set<ContentEmbedding>()
            .FirstOrDefaultAsync(e => e.SourceType == sourceType && e.SourceId == sourceId, ct);

        if (existing != null && existing.SourceTextHash == hash && existing.Status == EmbeddingStatus.Indexed)
            return; // 內容沒變動且已成功索引過，跳過

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
