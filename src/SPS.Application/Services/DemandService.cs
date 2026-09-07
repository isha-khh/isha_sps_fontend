using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Demand;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;

namespace SPS.Application.Services;

public class DemandService : IDemandService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IEmailService _emailService;
    private readonly ILogger<DemandService> _logger;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IEmbeddingService _embeddingService;

    public DemandService(
        IUnitOfWork unitOfWork,
        IEmailService emailService,
        ILogger<DemandService> logger,
        IServiceScopeFactory scopeFactory,
        IEmbeddingService embeddingService)
    {
        _unitOfWork = unitOfWork;
        _emailService = emailService;
        _logger = logger;
        _scopeFactory = scopeFactory;
        _embeddingService = embeddingService;
    }

    public async Task<Result<PagedResult<DemandResponse>>> GetPagedAsync(DemandQueryParameters parameters, CancellationToken ct = default)
    {
        var pagedResult = await _unitOfWork.Demands.GetPagedAsync(parameters, ct);

        var demandIds = pagedResult.Items.Select(d => d.Id).ToList();
        var tagIdsMap = await GetTagCategoryIdsMapAsync(demandIds, ct);
        var allTagIds = tagIdsMap.Values.SelectMany(ids => ids).Distinct().ToList();
        var tagNamesMap = await GetCategoryNamesAsync(allTagIds, ct);

        var response = new PagedResult<DemandResponse>
        {
            Items = pagedResult.Items.Select(d =>
            {
                var tagIds = tagIdsMap.GetValueOrDefault(d.Id) ?? new List<int>();
                return new DemandResponse
                {
                    Id = d.Id,
                    Number = d.Number,
                    Name = d.Name,
                    Introduction = d.Description,
                    CompanyId = d.CompanyId,
                    CompanyName = d.Company?.Name,
                    Published = d.Status == Status.Active,
                    CreatedTime = d.CreatedTime,
                    TagIds = tagIds,
                    TagNames = tagIds.Where(tagNamesMap.ContainsKey).Select(i => tagNamesMap[i]).ToList()
                };
            }).ToList(),
            TotalCount = pagedResult.TotalCount,
            Page = pagedResult.Page,
            PageSize = pagedResult.PageSize
        };
        return Result<PagedResult<DemandResponse>>.Success(response);
    }

    public async Task<Result<DemandResponse>> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var demand = await _unitOfWork.Demands.GetByIdAsync(id, ct);
        if (demand == null) return Result<DemandResponse>.Failure("需求不存在");
        return Result<DemandResponse>.Success(await BuildResponseAsync(demand, ct));
    }

    public async Task<Result<DemandResponse>> CreateAsync(CreateDemandRequest request, CancellationToken ct = default)
    {
        var demand = new Demand
        {
            Number = $"D{DateTime.UtcNow:yyyyMMddHHmmss}",
            Name = request.Name,
            Description = request.Introduction,
            CompanyId = request.CompanyId,
            Status = request.Published ? Status.Active : Status.Inactive,
            DataMode = DataMode.Normal,
            CreatedTime = DateTime.UtcNow,
            UpdatedTime = DateTime.UtcNow
        };
        await _unitOfWork.Demands.AddAsync(demand, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        TriggerDemandIndexing(demand.Id);

        return Result<DemandResponse>.Success(MapToResponse(demand, new List<int>(), new List<string>()));
    }

    public async Task<Result<DemandResponse>> UpdateAsync(int id, UpdateDemandRequest request, string? publisherEmail = null, CancellationToken ct = default)
    {
        var demand = await _unitOfWork.Demands.GetByIdAsync(id, ct);
        if (demand == null) return Result<DemandResponse>.Failure("需求不存在");

        var wasPublished = demand.Status == Status.Active;

        if (request.Name != null) demand.Name = request.Name;
        if (request.Introduction != null) demand.Description = request.Introduction;
        if (request.Published.HasValue) demand.Status = request.Published.Value ? Status.Active : Status.Inactive;
        demand.UpdatedTime = DateTime.UtcNow;

        await _unitOfWork.Demands.UpdateAsync(demand, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        // AI 向量媒合索引：內容或標籤有變動就重新索引（不限發布狀態，草稿也要能被 AI 面板即時比對）
        TriggerDemandIndexing(demand.Id);

        var isNowPublished = demand.Status == Status.Active;
        if (!wasPublished && isNowPublished)
        {
            var notificationIds = await PrepareNotificationRecordsAsync(demand, request.NotifyCompanyIds, ct);
            if (notificationIds.Count > 0)
            {
                // 在新的 DI scope 內執行，避免 request scope 結束後 DbContext 被 dispose
                var demandId = demand.Id;
                var demandName = demand.Name;
                var demandDesc = demand.Description ?? "";
                var bccEmail = string.IsNullOrWhiteSpace(publisherEmail) ? null : publisherEmail;
                _ = Task.Run(async () =>
                {
                    using var scope = _scopeFactory.CreateScope();
                    var uow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
                    var email = scope.ServiceProvider.GetRequiredService<IEmailService>();
                    await SendDemandMatchEmailsAsync(demandId, demandName, demandDesc, notificationIds, bccEmail, uow, email, CancellationToken.None);
                });
            }
        }

        return Result<DemandResponse>.Success(await BuildResponseAsync(demand, ct));
    }

    public async Task<Result<bool>> DeleteAsync(int id, CancellationToken ct = default)
    {
        var demand = await _unitOfWork.Demands.GetByIdAsync(id, ct);
        if (demand == null) return Result<bool>.Failure("需求不存在");
        await _unitOfWork.Demands.DeleteAsync(demand, ct);
        await _unitOfWork.SaveChangesAsync(ct);
        return Result<bool>.Success(true);
    }

    public async Task<Result<DemandStatisticsDto>> GetStatisticsAsync(CancellationToken ct = default)
    {
        try
        {
            var query = _unitOfWork.Demands.GetQueryable();
            var now = DateTime.UtcNow;
            var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var weekStart = now.Date.AddDays(-(int)now.DayOfWeek);

            var totalDemands = await query.CountAsync(ct);
            var publishedDemands = await query.CountAsync(d => d.Status == Status.Active, ct);
            var demandsThisMonth = await query.CountAsync(d => d.CreatedTime >= monthStart, ct);
            var demandsThisWeek = await query.CountAsync(d => d.CreatedTime >= weekStart, ct);

            // 按公司類型分組統計 - 需要 Include Company
            var queryWithCompany = query.Include(d => d.Company);
            var byCompanyType = new CompanyTypeBreakdown
            {
                Supplier = await queryWithCompany.CountAsync(d => d.Company != null && d.Company.Type == CompanyType.Supplier, ct),
                Buyer = await queryWithCompany.CountAsync(d => d.Company != null && d.Company.Type == CompanyType.Buyer, ct),
                Both = await queryWithCompany.CountAsync(d => d.Company != null && d.Company.Type == CompanyType.Both, ct)
            };

            var statistics = new DemandStatisticsDto
            {
                TotalDemands = totalDemands,
                PublishedDemands = publishedDemands,
                DraftDemands = totalDemands - publishedDemands,
                DemandsThisMonth = demandsThisMonth,
                DemandsThisWeek = demandsThisWeek,
                ByCompanyType = byCompanyType
            };

            return Result<DemandStatisticsDto>.Success(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting demand statistics");
            return Result<DemandStatisticsDto>.Failure($"獲取需求統計失敗: {ex.Message}");
        }
    }

    public async Task<Result<DemandTagsResponse>> GetTagsAsync(int id, CancellationToken ct = default)
    {
        var demand = await _unitOfWork.Demands.GetByIdAsync(id, ct);
        if (demand == null) return Result<DemandTagsResponse>.Failure("需求不存在");

        var tagIdsMap = await GetTagCategoryIdsMapAsync(new[] { id }, ct);
        var tagIds = tagIdsMap.GetValueOrDefault(id) ?? new List<int>();
        return Result<DemandTagsResponse>.Success(await BuildTagsResponseAsync(id, tagIds, ct));
    }

    public async Task<Result<DemandTagsResponse>> SetTagsAsync(int id, SetDemandTagsRequest request, CancellationToken ct = default)
    {
        var demand = await _unitOfWork.Demands.GetByIdAsync(id, ct);
        if (demand == null) return Result<DemandTagsResponse>.Failure("需求不存在");

        var requestedIds = (request.TagIds ?? new List<int>()).Distinct().ToList();

        if (requestedIds.Count > 0)
        {
            var validIds = await GetExistingCompanyTagCategoryIdsAsync(requestedIds, ct);
            var invalidIds = requestedIds.Except(validIds).ToList();
            if (invalidIds.Count > 0)
                return Result<DemandTagsResponse>.Failure(
                    $"以下標籤不存在或非企業標籤：{string.Join(", ", invalidIds)}");
        }

        await ReplaceDemandTagCategoriesAsync(id, requestedIds, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        // 標籤變動也算內容變動（來源文字含標籤名稱），需重新索引
        TriggerDemandIndexing(id);

        return Result<DemandTagsResponse>.Success(await BuildTagsResponseAsync(id, requestedIds, ct));
    }

    private async Task<DemandResponse> BuildResponseAsync(Demand d, CancellationToken ct)
    {
        var tagIdsMap = await GetTagCategoryIdsMapAsync(new[] { d.Id }, ct);
        var tagIds = tagIdsMap.GetValueOrDefault(d.Id) ?? new List<int>();
        var tagNamesMap = await GetCategoryNamesAsync(tagIds, ct);
        return MapToResponse(
            d,
            tagIds,
            tagIds.Where(tagNamesMap.ContainsKey).Select(i => tagNamesMap[i]).ToList());
    }

    private async Task<DemandTagsResponse> BuildTagsResponseAsync(int demandId, List<int> tagIds, CancellationToken ct)
    {
        var tagNamesMap = await GetCategoryNamesAsync(tagIds, ct);
        return new DemandTagsResponse
        {
            DemandId = demandId,
            TagIds = tagIds,
            TagNames = tagIds.Where(tagNamesMap.ContainsKey).Select(i => tagNamesMap[i]).ToList()
        };
    }

    private static DemandResponse MapToResponse(Demand d, List<int> tagIds, List<string> tagNames) => new()
    {
        Id = d.Id,
        Number = d.Number,
        Name = d.Name,
        Introduction = d.Description,
        CompanyId = d.CompanyId,
        CompanyName = d.Company?.Name,
        Published = d.Status == Status.Active,
        CreatedTime = d.CreatedTime,
        TagIds = tagIds,
        TagNames = tagNames
    };

    // ===== 需求標籤分類綁定（DemandTagCategory，共用 CompanyTag 分類）=====

    private async Task<Dictionary<int, List<int>>> GetTagCategoryIdsMapAsync(
        IReadOnlyCollection<int> demandIds, CancellationToken ct)
    {
        if (demandIds.Count == 0) return new Dictionary<int, List<int>>();

        var db = _unitOfWork.GetDbContext();
        var rows = await db.Set<DemandTagCategory>()
            .Where(dtc => demandIds.Contains(dtc.DemandId))
            .Select(dtc => new { dtc.DemandId, dtc.CategoryId })
            .ToListAsync(ct);

        return rows
            .GroupBy(r => r.DemandId)
            .ToDictionary(g => g.Key, g => g.Select(r => r.CategoryId).ToList());
    }

    private async Task<Dictionary<int, string>> GetCategoryNamesAsync(
        IReadOnlyCollection<int> categoryIds, CancellationToken ct)
    {
        if (categoryIds.Count == 0) return new Dictionary<int, string>();

        var db = _unitOfWork.GetDbContext();
        return await db.Set<Category>()
            .Where(c => categoryIds.Contains(c.Id) && c.Name != null)
            .ToDictionaryAsync(c => c.Id, c => c.Name!, ct);
    }

    private async Task<List<int>> GetExistingCompanyTagCategoryIdsAsync(
        IReadOnlyCollection<int> categoryIds, CancellationToken ct)
    {
        if (categoryIds.Count == 0) return new List<int>();

        var db = _unitOfWork.GetDbContext();
        return await db.Set<Category>()
            .Where(c => c.Type == CategoryType.CompanyTag && categoryIds.Contains(c.Id))
            .Select(c => c.Id)
            .ToListAsync(ct);
    }

    private async Task ReplaceDemandTagCategoriesAsync(
        int demandId, IEnumerable<int> categoryIds, CancellationToken ct)
    {
        var db = _unitOfWork.GetDbContext();
        var set = db.Set<DemandTagCategory>();

        var existing = await set.Where(dtc => dtc.DemandId == demandId).ToListAsync(ct);
        var desired = categoryIds.Distinct().ToHashSet();
        var existingIds = existing.Select(e => e.CategoryId).ToHashSet();

        var toRemove = existing.Where(e => !desired.Contains(e.CategoryId)).ToList();
        if (toRemove.Count > 0) set.RemoveRange(toRemove);

        foreach (var categoryId in desired.Where(cid => !existingIds.Contains(cid)))
            set.Add(new DemandTagCategory { DemandId = demandId, CategoryId = categoryId });
    }

    // ===== 標籤相似度匹配 =====

    public async Task<Result<List<SimilarCompanyResponse>>> GetSimilarCompaniesAsync(List<int> tagIds, CancellationToken ct = default)
    {
        if (tagIds == null || tagIds.Count == 0)
            return Result<List<SimilarCompanyResponse>>.Success(new List<SimilarCompanyResponse>());

        var db = _unitOfWork.GetDbContext();
        var tagSet = tagIds.ToHashSet();

        var supplierCompanies = await db.Set<Company>()
            .Where(c => c.Type == CompanyType.Supplier || c.Type == CompanyType.Both)
            .Select(c => new { c.Id, c.Name, c.ChargeEmail })
            .ToListAsync(ct);

        if (supplierCompanies.Count == 0)
            return Result<List<SimilarCompanyResponse>>.Success(new List<SimilarCompanyResponse>());

        var supplierIds = supplierCompanies.Select(c => c.Id).ToList();

        var companyTagRows = await db.Set<CompanyTagCategory>()
            .Where(ctc => supplierIds.Contains(ctc.CompanyId))
            .Select(ctc => new { ctc.CompanyId, ctc.CategoryId })
            .ToListAsync(ct);

        var companyDict = supplierCompanies.ToDictionary(c => c.Id);

        var candidates = companyTagRows
            .GroupBy(r => r.CompanyId)
            .Select(g =>
            {
                var companyTagSet = g.Select(r => r.CategoryId).ToHashSet();
                var matchedIds = companyTagSet.Intersect(tagSet).ToList();
                return new { CompanyId = g.Key, MatchedIds = matchedIds, CompanyTagCount = companyTagSet.Count };
            })
            .Where(x => x.MatchedIds.Count > 0)
            .OrderByDescending(x => x.MatchedIds.Count)
            .ToList();

        if (candidates.Count == 0)
            return Result<List<SimilarCompanyResponse>>.Success(new List<SimilarCompanyResponse>());

        var allMatchedIds = candidates.SelectMany(c => c.MatchedIds).Distinct().ToList();
        var tagNamesMap = await GetCategoryNamesAsync(allMatchedIds, ct);

        var result = candidates.Select(c =>
        {
            var company = companyDict[c.CompanyId];
            return new SimilarCompanyResponse
            {
                CompanyId = c.CompanyId,
                CompanyName = company.Name,
                ChargeEmail = company.ChargeEmail,
                MatchCount = c.MatchedIds.Count,
                DemandTagCount = tagIds.Count,
                CompanyTagCount = c.CompanyTagCount,
                OverlapPercent = Math.Round((double)c.MatchedIds.Count / tagIds.Count * 100, 1),
                MatchedTagNames = c.MatchedIds
                    .Where(tagNamesMap.ContainsKey)
                    .Select(id => tagNamesMap[id])
                    .ToList()
            };
        }).ToList();

        return Result<List<SimilarCompanyResponse>>.Success(result);
    }

    // ===== AI 語意搜尋（純向量 + CSLS 簡化版偏誤修正）=====
    // 詳見 docs/設計/AI向量媒合搜尋設計.md §5.4、§9

    public async Task<Result<List<SimilarCompanyByVectorResponse>>> GetSimilarCompaniesByVectorAsync(
        int demandId, int topN = 20, CancellationToken ct = default)
    {
        var demand = await _unitOfWork.Demands.GetByIdAsync(demandId, ct);
        if (demand == null) return Result<List<SimilarCompanyByVectorResponse>>.Failure("需求不存在");

        var tagIdsMap = await GetTagCategoryIdsMapAsync(new[] { demandId }, ct);
        var tagIds = tagIdsMap.GetValueOrDefault(demandId) ?? new List<int>();
        var tagNamesMap = await GetCategoryNamesAsync(tagIds, ct);
        var tagNames = tagIds.Where(tagNamesMap.ContainsKey).Select(id => tagNamesMap[id]).ToList();

        var demandText = string.Join(" ",
            new[] { demand.Name, demand.Description }.Concat(tagNames).Where(s => !string.IsNullOrWhiteSpace(s)));

        return await SearchSimilarCompaniesByTextAsync(demandText, topN, ct);
    }

    /// <summary>
    /// 即時預覽：不需要先儲存需求，直接用當下輸入的名稱/介紹/標籤做一次性查詢，
    /// 不寫入 ContentEmbedding（跟事件觸發/排程掃描的正式索引無關），查完即丟。
    /// 給新增需求頁面「AI 推薦」按鈕用，讓使用者存檔前就能看到建議。
    /// </summary>
    public async Task<Result<List<SimilarCompanyByVectorResponse>>> PreviewSimilarCompaniesByVectorAsync(
        string? name, string? introduction, List<int>? tagIds, int topN = 20, CancellationToken ct = default)
    {
        var tagNames = new List<string>();
        if (tagIds is { Count: > 0 })
        {
            var tagNamesMap = await GetCategoryNamesAsync(tagIds, ct);
            tagNames = tagIds.Where(tagNamesMap.ContainsKey).Select(id => tagNamesMap[id]).ToList();
        }

        var text = string.Join(" ",
            new[] { name, introduction }.Concat(tagNames).Where(s => !string.IsNullOrWhiteSpace(s)));

        return await SearchSimilarCompaniesByTextAsync(text, topN, ct);
    }

    private async Task<Result<List<SimilarCompanyByVectorResponse>>> SearchSimilarCompaniesByTextAsync(
        string demandText, int topN, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(demandText))
            return Result<List<SimilarCompanyByVectorResponse>>.Success(new List<SimilarCompanyByVectorResponse>());

        var queryResult = await _embeddingService.EmbedQueryAsync(demandText, ct);
        if (!queryResult.IsSuccess)
            return Result<List<SimilarCompanyByVectorResponse>>.Failure(queryResult.Error ?? "AI 語意搜尋暫不可用");

        var queryVector = queryResult.Data!;
        var db = _unitOfWork.GetDbContext();

        var companyEmbeddings = await db.Set<ContentEmbedding>()
            .Where(e => e.SourceType == EmbeddingSourceType.Company && e.Status == EmbeddingStatus.Indexed && e.Embedding != null)
            .Select(e => new { e.SourceId, e.Embedding })
            .ToListAsync(ct);

        if (companyEmbeddings.Count == 0)
            return Result<List<SimilarCompanyByVectorResponse>>.Success(new List<SimilarCompanyByVectorResponse>());

        // CSLS 簡化版偏誤修正：資料量小（企業/需求千筆等級），直接把所有已索引 Demand 查詢向量
        // 讀進記憶體算平均相似度即可，不需要在 SQL 端做交叉join。資料量大幅成長後可改成
        // SQL 端聚合或改回精確的 CSLS K-近鄰統計，見 §5.4。
        var allDemandVectors = await db.Set<ContentEmbedding>()
            .Where(e => e.SourceType == EmbeddingSourceType.Demand && e.Status == EmbeddingStatus.Indexed && e.Embedding != null)
            .Select(e => e.Embedding!)
            .ToListAsync(ct);

        var scored = companyEmbeddings
            .Select(c =>
            {
                var rawSim = CosineSimilarity(queryVector, c.Embedding!);
                var bias = allDemandVectors.Count > 0
                    ? allDemandVectors.Average(dv => CosineSimilarity(dv, c.Embedding!))
                    : 0;
                return (CompanyId: c.SourceId, Score: rawSim - bias);
            })
            .OrderByDescending(x => x.Score)
            .Take(topN)
            .ToList();

        var companyIds = scored.Select(s => Guid.Parse(s.CompanyId)).ToList();
        var companies = await db.Set<Company>()
            .Where(c => companyIds.Contains(c.Id))
            .Select(c => new { c.Id, c.Name, c.ChargeEmail })
            .ToListAsync(ct);
        var companyMap = companies.ToDictionary(c => c.Id);

        var response = new List<SimilarCompanyByVectorResponse>();
        var rank = 1;
        foreach (var s in scored)
        {
            var id = Guid.Parse(s.CompanyId);
            if (!companyMap.TryGetValue(id, out var company)) continue;
            response.Add(new SimilarCompanyByVectorResponse
            {
                CompanyId = id,
                CompanyName = company.Name,
                ChargeEmail = company.ChargeEmail,
                Rank = rank++
            });
        }

        return Result<List<SimilarCompanyByVectorResponse>>.Success(response);
    }

    private static double CosineSimilarity(float[] a, float[] b)
    {
        double dot = 0, magA = 0, magB = 0;
        for (var i = 0; i < a.Length; i++)
        {
            dot += a[i] * b[i];
            magA += a[i] * a[i];
            magB += b[i] * b[i];
        }
        return dot / (Math.Sqrt(magA) * Math.Sqrt(magB));
    }

    // ===== 通知記錄查詢 =====

    public async Task<Result<List<DemandNotificationResponse>>> GetNotificationsAsync(int demandId, CancellationToken ct = default)
    {
        var records = await _unitOfWork.DemandNotifications.GetByDemandIdAsync(demandId, ct);
        var result = records.Select(r => new DemandNotificationResponse(
            r.Id, r.CompanyName, r.RecipientEmail, r.Status, r.ErrorMessage, r.SentAt, r.CreatedTime
        )).ToList();
        return Result<List<DemandNotificationResponse>>.Success(result);
    }

    // ===== 發布時寄送媒合通知 =====

    private async Task<List<int>> PrepareNotificationRecordsAsync(Demand demand, List<Guid>? notifyCompanyIds, CancellationToken ct)
    {
        var tagIdsMap = await GetTagCategoryIdsMapAsync(new[] { demand.Id }, ct);
        var tagIds = tagIdsMap.GetValueOrDefault(demand.Id) ?? new List<int>();
        if (tagIds.Count == 0) return new List<int>();

        var similarResult = await GetSimilarCompaniesAsync(tagIds, ct);
        if (!similarResult.IsSuccess) return new List<int>();

        var targets = similarResult.Data!
            .Where(c => c.OverlapPercent >= 30)
            .ToList();

        if (notifyCompanyIds != null)
        {
            var allowed = notifyCompanyIds.ToHashSet();
            targets = targets.Where(c => allowed.Contains(c.CompanyId)).ToList();
        }

        if (targets.Count == 0) return new List<int>();

        // 查詢目標業者底下的供給端會員（已啟用、已審核）作為收件者
        var targetCompanyIds = targets.Select(c => c.CompanyId).ToList();
        var companyNameMap = targets.ToDictionary(c => c.CompanyId, c => c.CompanyName);

        var db = _unitOfWork.GetDbContext();
        var members = await db.Set<Member>()
            .Where(m => m.CompanyId.HasValue
                     && targetCompanyIds.Contains(m.CompanyId.Value)
                     && m.Role == MemberRole.Supplier
                     && m.Status == Status.Active
                     && m.IsApproved
                     && m.Email != string.Empty)
            .Select(m => new { m.CompanyId, m.Email })
            .ToListAsync(ct);

        var newRecords = new List<DemandNotification>();
        foreach (var member in members)
        {
            var record = new DemandNotification
            {
                DemandId = demand.Id,
                CompanyId = member.CompanyId,
                CompanyName = member.CompanyId.HasValue ? companyNameMap.GetValueOrDefault(member.CompanyId.Value) : null,
                RecipientEmail = member.Email,
                Status = DemandNotificationStatus.Pending,
            };
            await _unitOfWork.DemandNotifications.AddAsync(record, ct);
            newRecords.Add(record);
        }
        await _unitOfWork.SaveChangesAsync(ct);

        // SaveChanges 後 EF 填回 PK，只回傳本次新建的 ID（避免舊的 Pending 記錄被重複處理）
        return newRecords.Select(r => r.Id).ToList();
    }

    private async Task SendDemandMatchEmailsAsync(
        int demandId, string demandName, string demandDesc,
        List<int> notificationIds, string? bccEmail,
        IUnitOfWork unitOfWork, IEmailService emailService,
        CancellationToken ct)
    {
        try
        {
            var db = unitOfWork.GetDbContext();

            var tagIds = await db.Set<DemandTagCategory>()
                .Where(dtc => dtc.DemandId == demandId)
                .Select(dtc => dtc.CategoryId)
                .ToListAsync(ct);

            var tagNamesMap = await db.Set<Category>()
                .Where(c => tagIds.Contains(c.Id) && c.Name != null)
                .ToDictionaryAsync(c => c.Id, c => c.Name!, ct);
            var tagNames = tagIds.Where(tagNamesMap.ContainsKey).Select(id => tagNamesMap[id]).ToList();

            var records = (await unitOfWork.DemandNotifications.GetByDemandIdAsync(demandId, ct))
                .Where(r => notificationIds.Contains(r.Id))
                .ToList();

            foreach (var record in records)
            {
                try
                {
                    await emailService.SendDemandMatchNotificationEmailAsync(
                        record.RecipientEmail, demandName, demandDesc, tagNames, bccEmail, ct);
                    record.Status = DemandNotificationStatus.Sent;
                    record.SentAt = DateTime.UtcNow;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "傳送媒合通知信給 {Email} 失敗", record.RecipientEmail);
                    record.Status = DemandNotificationStatus.Failed;
                    record.ErrorMessage = ex.Message;
                }
                record.UpdatedTime = DateTime.UtcNow;
                await unitOfWork.DemandNotifications.UpdateAsync(record, ct);
                await unitOfWork.SaveChangesAsync(ct);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "需求 {DemandId} 發布媒合通知流程失敗", demandId);
        }
    }

    /// <summary>
    /// AI 向量媒合索引：事件觸發路徑（§4.1）。在新的 DI scope 內背景執行，避免呼叫端 request scope
    /// 結束後 DbContext 被 dispose；失敗只記 log，不影響需求儲存本身，留給排程掃描（§4.2）重試。
    /// </summary>
    private void TriggerDemandIndexing(int demandId)
    {
        _ = Task.Run(async () =>
        {
            using var scope = _scopeFactory.CreateScope();
            var indexingService = scope.ServiceProvider.GetRequiredService<IContentIndexingService>();
            try
            {
                await indexingService.IndexDemandAsync(demandId, CancellationToken.None);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "需求 {DemandId} AI 向量索引失敗（將由排程掃描重試）", demandId);
            }
        });
    }
}
