using Microsoft.EntityFrameworkCore;
using SPS.Application.DTOs.Company;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
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
        var query = _dbSet
            .Include(c => c.Photo)
            .AsQueryable();

        // 搜索過濾
        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            var search = parameters.Search;
            query = query.Where(c =>
                c.Name.Contains(search) ||
                c.Number.Contains(search) ||
                (c.EnglishName != null && c.EnglishName.Contains(search)) ||
                (c.Subject != null && c.Subject.Contains(search)) ||
                (c.Introduction != null && c.Introduction.Contains(search)));
        }

        // 標籤過濾（符合任一勾選標籤）
        if (parameters.TagIds is { Count: > 0 })
        {
            var tagIds = parameters.TagIds;
            query = query.Where(c => _context.Set<CompanyTagCategory>().Any(t => t.CompanyId == c.Id && tagIds.Contains(t.CategoryId)));
        }

        // 類型過濾
        if (parameters.Type.HasValue)
        {
            query = query.Where(c => c.Type == parameters.Type.Value);
        }

        // 級別過濾
        if (parameters.Level.HasValue)
        {
            query = query.Where(c => c.Level == parameters.Level.Value);
        }

        // 狀態過濾
        if (parameters.Status.HasValue)
        {
            query = query.Where(c => c.Status == parameters.Status.Value);
        }

        // 驗證狀態過濾
        if (parameters.IsVerified.HasValue)
        {
            query = query.Where(c => c.IsVerified == parameters.IsVerified.Value);
        }

        // 總數
        var totalCount = await query.CountAsync(cancellationToken);

        // 排序
        query = parameters.DirectorySortRules != null
            ? ApplyDirectorySorting(query, parameters.DirectorySortRules)
            : ApplySorting(query, parameters.SortBy, parameters.Descending);

        // 分頁
        var items = await query
            .Skip((parameters.Page - 1) * parameters.PageSize)
            .Take(parameters.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Company>
        {
            Items = items,
            TotalCount = totalCount,
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

    /// <summary>
    /// 前台企業名錄的排序（後台「頁面設定」）：規則依優先順序逐條套用，前面分不出高下才看下一條；
    /// 最後固定補「新的在前」與編號，換頁時順序才穩定。沒有任何啟用的規則＝只有這兩條。
    /// </summary>
    private IQueryable<Company> ApplyDirectorySorting(IQueryable<Company> query, List<EnterpriseSortRuleDto> rules)
    {
        IOrderedQueryable<Company>? ordered = null;
        var usedNewest = false;

        IOrderedQueryable<Company> Add<TKey>(System.Linq.Expressions.Expression<Func<Company, TKey>> key, bool descending)
            => ordered == null
                ? (descending ? query.OrderByDescending(key) : query.OrderBy(key))
                : (descending ? ordered.ThenByDescending(key) : ordered.ThenBy(key));

        foreach (var rule in rules)
        {
            switch (rule.Key)
            {
                case EnterpriseDirectorySortKeys.Completeness:
                    // 基本資料有填的欄位數（簡介、主要產品暨服務、電話、地址、網址、成立日期、資本總額），圖片與標籤另有各自的依據
                    ordered = Add(c =>
                        (c.Introduction != null && c.Introduction != "" ? 1 : 0) +
                        (c.Subject != null && c.Subject != "" ? 1 : 0) +
                        (c.Phone != null && c.Phone != "" ? 1 : 0) +
                        (c.AddressId != null ? 1 : 0) +
                        (c.OrgUrl != null && c.OrgUrl != "" ? 1 : 0) +
                        (c.EstablishmentDate != null && c.EstablishmentDate != "" ? 1 : 0) +
                        (c.Revenue != null ? 1 : 0), rule.Descending);
                    break;
                case EnterpriseDirectorySortKeys.Image:
                    ordered = Add(c => c.PhotoId != null ? 1 : 0, rule.Descending);
                    break;
                case EnterpriseDirectorySortKeys.Tags:
                    ordered = Add(c => _context.Set<CompanyTagCategory>().Count(t => t.CompanyId == c.Id), rule.Descending);
                    break;
                case EnterpriseDirectorySortKeys.Newest:
                    ordered = Add(c => c.CreatedTime, rule.Descending);
                    usedNewest = true;
                    break;
            }
        }

        if (!usedNewest) ordered = Add(c => c.CreatedTime, true);
        return Add(c => c.Id, true);
    }

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
