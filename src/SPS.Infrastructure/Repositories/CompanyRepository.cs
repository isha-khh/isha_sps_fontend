using Microsoft.EntityFrameworkCore;
using SPS.Application.DTOs.Company;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces.IRepositories;
using SPS.Application.Services;
using SPS.Domain.Entities;
using SPS.Domain.Enums;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Repositories.Common;

namespace SPS.Infrastructure.Repositories;

/// <summary>
/// 企業倉儲實現
/// </summary>
public class CompanyRepository : Repository<Company, Guid>, ICompanyRepository
{
    public CompanyRepository(ApplicationDbContext context) : base(context)
    {
    }

    public override async Task<Company?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(c => c.Address)
            .Include(c => c.Photo)
            .Include(c => c.Banner)
            .Include(c => c.Members)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<Company?> GetByUnifiedSocialCreditCodeAsync(string unifiedSocialCreditCode, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(c => c.UnifiedSocialCreditCode == unifiedSocialCreditCode, cancellationToken);
    }

    public async Task<bool> ExistsByUnifiedSocialCreditCodeAsync(string unifiedSocialCreditCode, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AnyAsync(c => c.UnifiedSocialCreditCode == unifiedSocialCreditCode, cancellationToken);
    }

    public async Task<PagedResult<Company>> GetPagedAsync(
        CompanyQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        // 先套用「搜尋以外」的條件，關鍵字與語意搜尋再各自疊上去
        var filtered = _dbSet
            .Include(c => c.Photo)
            .AsQueryable();

        // 標籤過濾（符合任一勾選標籤）
        if (parameters.TagIds is { Count: > 0 })
        {
            var tagIds = parameters.TagIds;
            filtered = filtered.Where(c => _context.Set<CompanyTagCategory>().Any(t => t.CompanyId == c.Id && tagIds.Contains(t.CategoryId)));
        }

        // 類型過濾
        if (parameters.Type.HasValue)
        {
            filtered = filtered.Where(c => c.Type == parameters.Type.Value);
        }

        // 前台名錄「只顯示供給端」：供給端與供需雙方（需求端不列出）
        if (parameters.SupplierSideOnly)
        {
            filtered = filtered.Where(c => c.Type == CompanyType.Supplier || c.Type == CompanyType.Both);
        }

        // 級別過濾
        if (parameters.Level.HasValue)
        {
            filtered = filtered.Where(c => c.Level == parameters.Level.Value);
        }

        // 狀態過濾
        if (parameters.Status.HasValue)
        {
            filtered = filtered.Where(c => c.Status == parameters.Status.Value);
        }

        // 驗證狀態過濾
        if (parameters.IsVerified.HasValue)
        {
            filtered = filtered.Where(c => c.IsVerified == parameters.IsVerified.Value);
        }

        // 關鍵字：名稱、編號、英文名稱、主要產品暨服務、簡介，以及企業掛的標籤名稱（搜「ZigBee」找得到標了 ZigBee 的企業）
        var query = filtered;
        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            var search = parameters.Search;
            query = query.Where(c =>
                c.Name.Contains(search) ||
                c.Number.Contains(search) ||
                (c.EnglishName != null && c.EnglishName.Contains(search)) ||
                (c.Subject != null && c.Subject.Contains(search)) ||
                (c.Introduction != null && c.Introduction.Contains(search)) ||
                _context.Set<CompanyTagCategory>().Any(t => t.CompanyId == c.Id && t.Category.Name != null && t.Category.Name.Contains(search)));
        }

        // 關鍵字比對到的總數
        var keywordTotal = await query.CountAsync(cancellationToken);

        // 排序
        query = parameters.DirectorySortRules != null
            ? ApplyDirectorySorting(query, parameters.DirectorySortRules)
            : ApplySorting(query, parameters.SortBy, parameters.Descending);

        var skip = (parameters.Page - 1) * parameters.PageSize;

        // 沒有語意命中（沒開、沒啟用、連不上、沒有命中）：就是一般的關鍵字分頁
        if (parameters.SemanticCompanyIds is not { Count: > 0 } || string.IsNullOrWhiteSpace(parameters.Search))
        {
            var items = await query
                .Skip(skip)
                .Take(parameters.PageSize)
                .ToListAsync(cancellationToken);

            return new PagedResult<Company>
            {
                Items = items,
                TotalCount = keywordTotal,
                Page = parameters.Page,
                PageSize = parameters.PageSize
            };
        }

        // 語意命中的企業（已經套用上面的標籤／類型／狀態等條件）。語意命中數量很少（上限 40），整批取回來在記憶體排序與分頁。
        // 關鍵字已經比對到的排在前面（照後台的名錄排序），語意命中但關鍵字沒比對到的依相似度接在後面
        var semanticIds = parameters.SemanticCompanyIds;
        var semanticCandidates = await filtered
            .Where(c => semanticIds.Contains(c.Id))
            .ToListAsync(cancellationToken);
        var keywordMatchedIds = (await query
            .Where(c => semanticIds.Contains(c.Id))
            .Select(c => c.Id)
            .ToListAsync(cancellationToken)).ToHashSet();
        var rank = semanticIds.Select((id, index) => (id, index)).ToDictionary(x => x.id, x => x.index);
        var semanticOnly = semanticCandidates
            .Where(c => !keywordMatchedIds.Contains(c.Id))
            .OrderBy(c => rank[c.Id])
            .ToList();

        var result = new List<Company>();
        if (skip < keywordTotal)
        {
            result.AddRange(await query.Skip(skip).Take(parameters.PageSize).ToListAsync(cancellationToken));
        }
        var remaining = parameters.PageSize - result.Count;
        if (remaining > 0)
        {
            result.AddRange(semanticOnly.Skip(Math.Max(0, skip - keywordTotal)).Take(remaining));
        }

        return new PagedResult<Company>
        {
            Items = result,
            TotalCount = keywordTotal + semanticOnly.Count,
            Page = parameters.Page,
            PageSize = parameters.PageSize
        };
    }

    public async Task<List<Company>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .OrderBy(c => c.Name)
            .ToListAsync(cancellationToken);
    }

    /// <summary>前台企業名錄的排序（後台「頁面設定」），與全站搜尋的企業結果共用 <see cref="CompanyDirectoryOrdering"/></summary>
    private IQueryable<Company> ApplyDirectorySorting(IQueryable<Company> query, List<EnterpriseSortRuleDto> rules)
        => CompanyDirectoryOrdering.Apply(query, rules, _context);

    private IQueryable<Company> ApplySorting(
        IQueryable<Company> query,
        string? sortBy,
        bool descending)
    {
        if (string.IsNullOrWhiteSpace(sortBy))
        {
            return descending
                ? query.OrderByDescending(c => c.CreatedTime)
                : query.OrderBy(c => c.CreatedTime);
        }

        return sortBy.ToLower() switch
        {
            "name" => descending ? query.OrderByDescending(c => c.Name) : query.OrderBy(c => c.Name),
            "number" => descending ? query.OrderByDescending(c => c.Number) : query.OrderBy(c => c.Number),
            "employees" => descending ? query.OrderByDescending(c => c.Employees) : query.OrderBy(c => c.Employees),
            "revenue" => descending ? query.OrderByDescending(c => c.Revenue) : query.OrderBy(c => c.Revenue),
            "createdtime" => descending ? query.OrderByDescending(c => c.CreatedTime) : query.OrderBy(c => c.CreatedTime),
            _ => descending ? query.OrderByDescending(c => c.CreatedTime) : query.OrderBy(c => c.CreatedTime)
        };
    }
}
