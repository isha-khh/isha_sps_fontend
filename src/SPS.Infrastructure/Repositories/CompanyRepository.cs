using Microsoft.EntityFrameworkCore;
using SPS.Application.DTOs.Company;
using SPS.Application.DTOs.Common;
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
        query = ApplySorting(query, parameters.SortBy, parameters.Descending);

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
