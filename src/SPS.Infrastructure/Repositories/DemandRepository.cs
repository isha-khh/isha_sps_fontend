using Microsoft.EntityFrameworkCore;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Demand;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Repositories.Common;

namespace SPS.Infrastructure.Repositories;

public class DemandRepository : Repository<Demand, int>, IDemandRepository
{
    public DemandRepository(ApplicationDbContext context) : base(context)
    {
    }

    public override async Task<Demand?> GetByIdAsync(int id, CancellationToken ct = default) =>
        await _dbSet.Include(d => d.Company).FirstOrDefaultAsync(d => d.Id == id, ct);

    public async Task<PagedResult<Demand>> GetPagedAsync(DemandQueryParameters parameters, CancellationToken ct = default)
    {
        var query = _dbSet.Include(d => d.Company).AsQueryable();
        if (!string.IsNullOrWhiteSpace(parameters.Search))
            query = query.Where(d => d.Name.Contains(parameters.Search) || d.Number.Contains(parameters.Search));
        if (parameters.CompanyId.HasValue)
            query = query.Where(d => d.CompanyId == parameters.CompanyId.Value);
        if (parameters.Published.HasValue)
            query = query.Where(d => d.Status == (parameters.Published.Value ? SPS.Domain.Enums.Status.Active : SPS.Domain.Enums.Status.Inactive));
        
        var totalCount = await query.CountAsync(ct);
        var items = await query.OrderByDescending(d => d.CreatedTime)
            .Skip((parameters.Page - 1) * parameters.PageSize).Take(parameters.PageSize).ToListAsync(ct);
        return new PagedResult<Demand> { Items = items, TotalCount = totalCount, Page = parameters.Page, PageSize = parameters.PageSize };
    }
}
