using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;

namespace SPS.Application.Services;

/// <summary>一筆語意命中：哪一種來源、哪一筆、跟搜尋詞的相似度（單位向量內積，越高越像）</summary>
public sealed record SemanticHit(EmbeddingSourceType Type, string Id, double Score);

/// <summary>
/// 語意搜尋引擎：全站搜尋（<see cref="SearchService"/>）與企業名錄搜尋（<c>CompanyService</c>）共用。
/// 把搜尋詞用 embedding 模型轉成向量，跟已索引的內容向量比相似度，依門檻挑出命中的項目。
///
/// 搜尋詞向量依關鍵字快取，已索引的向量整份快取在記憶體；門檻在 appsettings 的 <c>Search:SemanticMinScore</c> 與
/// <c>Search:SemanticRelativeMargin</c>，可以不改程式碼調整。語意搜尋壞掉（沒啟用、模型連不上、逾時、頻率超過上限）
/// 一律回空清單，呼叫端退回純關鍵字搜尋，不影響搜尋本身。
/// </summary>
public interface ISemanticSearchEngine
{
    /// <summary>
    /// 找出跟搜尋詞意思相近的項目，由高分到低分。<paramref name="onlyTypes"/> 有指定時只比對這幾種來源，
    /// 而且門檻的「相對最高分」也只在這幾種之間算（企業名錄只搜企業，不會被別種內容的高分墊高門檻）；不指定就比對全站搜尋涵蓋的所有來源。
    /// </summary>
    Task<List<SemanticHit>> FindHitsAsync(DbContext db, string keyword, IReadOnlyCollection<EmbeddingSourceType>? onlyTypes, CancellationToken ct);
}

public class SemanticSearchEngine : ISemanticSearchEngine
{
    /// <summary>每分鐘最多向 embedding 服務查幾個「沒快取過的」搜尋詞；超過就這一分鐘不做語意搜尋（匿名端點的成本保護）</summary>
    private const int MaxQueryEmbeddingsPerMinute = 30;

    private const int SemanticMaxHitsPerType = 10;
    private const int SemanticMaxTotalHits = 40;
    private static readonly TimeSpan SemanticQueryTimeout = TimeSpan.FromSeconds(5);
    private const string VectorsCacheKey = "search:semantic-vectors";

    private readonly IEmbeddingService _embeddingService;
    private readonly IMemoryCache _cache;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SemanticSearchEngine> _logger;

    public SemanticSearchEngine(
        IEmbeddingService embeddingService,
        IMemoryCache cache,
        IConfiguration configuration,
        ILogger<SemanticSearchEngine> logger)
    {
        _embeddingService = embeddingService;
        _cache = cache;
        _configuration = configuration;
        _logger = logger;
    }

    private sealed record IndexedVector(EmbeddingSourceType Type, string Id, float[] Vector);

    private sealed class QueryVectorEntry
    {
        public float[]? Vector { get; init; }
    }

    /// <summary>算搜尋詞跟所有已索引向量的相似度，依門檻挑出命中的項目（由高到低）</summary>
    public async Task<List<SemanticHit>> FindHitsAsync(DbContext db, string keyword, IReadOnlyCollection<EmbeddingSourceType>? onlyTypes, CancellationToken ct)
    {
        var empty = new List<SemanticHit>();
        var query = await GetQueryVectorAsync(keyword, ct);
        if (query == null) return empty;

        var vectors = await GetSearchVectorsAsync(db, ct);
        if (vectors.Count == 0) return empty;

        var scored = new List<SemanticHit>(vectors.Count);
        foreach (var v in vectors)
        {
            if (onlyTypes != null && !onlyTypes.Contains(v.Type)) continue;
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
