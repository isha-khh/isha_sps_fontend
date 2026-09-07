using Microsoft.EntityFrameworkCore;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Product;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Repositories.Common;

namespace SPS.Infrastructure.Repositories;

/// <summary>
/// 產品倉儲實現
/// </summary>
public class ProductRepository : Repository<Product, int>, IProductRepository
{
    public ProductRepository(ApplicationDbContext context) : base(context)
    {
    }

    public override async Task<Product?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.Company)
            .Include(p => p.Category)
            .Include(p => p.Cover)
            .Include(p => p.Pictures.OrderBy(pic => pic.Ordinal))
            .Include(p => p.Files)
            .Include(p => p.UploadedFiles)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<PagedResult<Product>> GetPagedAsync(
        ProductQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet
            .Include(p => p.Company)
            .Include(p => p.Category)
            .Include(p => p.Cover)
            .AsQueryable();

        // 搜索過濾
        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            query = query.Where(p =>
                p.Name.Contains(parameters.Search) ||
                p.Number.Contains(parameters.Search) ||
                (p.ModelNo != null && p.ModelNo.Contains(parameters.Search)));
        }

        // 類別過濾
        if (parameters.CategoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == parameters.CategoryId.Value);
        }

        // 企業過濾
        if (parameters.CompanyId.HasValue)
        {
            query = query.Where(p => p.CompanyId == parameters.CompanyId.Value);
        }

        // 發布狀態過濾
        if (parameters.Published.HasValue)
        {
            query = query.Where(p => p.Published == parameters.Published.Value);
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

        return new PagedResult<Product>
        {
            Items = items,
            TotalCount = totalCount,
            Page = parameters.Page,
            PageSize = parameters.PageSize
        };
    }

    public async Task<List<Product>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.Company)
            .Include(p => p.Category)
            .Include(p => p.Cover)
            .OrderBy(p => p.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Product>> GetByCompanyIdAsync(
        Guid companyId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.Category)
            .Include(p => p.Cover)
            .Where(p => p.CompanyId == companyId)
            .OrderByDescending(p => p.CreatedTime)
            .ToListAsync(cancellationToken);
    }

    private IQueryable<Product> ApplySorting(
        IQueryable<Product> query,
        string? sortBy,
        bool descending)
    {
        if (string.IsNullOrWhiteSpace(sortBy))
        {
            return descending
                ? query.OrderByDescending(p => p.CreatedTime)
                : query.OrderBy(p => p.CreatedTime);
        }

        return sortBy.ToLower() switch
        {
            "name" => descending ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name),
            "number" => descending ? query.OrderByDescending(p => p.Number) : query.OrderBy(p => p.Number),
            "createdtime" => descending ? query.OrderByDescending(p => p.CreatedTime) : query.OrderBy(p => p.CreatedTime),
            _ => descending ? query.OrderByDescending(p => p.CreatedTime) : query.OrderBy(p => p.CreatedTime)
        };
    }
}
