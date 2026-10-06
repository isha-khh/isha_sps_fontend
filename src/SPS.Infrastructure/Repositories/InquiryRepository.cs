using Microsoft.EntityFrameworkCore;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Inquiry;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Domain.Enums;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Repositories.Common;

namespace SPS.Infrastructure.Repositories;

public class InquiryRepository : Repository<Inquiry, Guid>, IInquiryRepository
{
    public InquiryRepository(ApplicationDbContext context) : base(context) { }

    public async Task<PagedResult<Inquiry>> GetPagedAsync(InquiryQueryParameters parameters, CancellationToken ct = default)
    {
        var query = _dbSet.AsQueryable();
        if (parameters.Type.HasValue) query = query.Where(i => i.Type == parameters.Type.Value);
        if (parameters.Status.HasValue) query = query.Where(i => i.Status == parameters.Status.Value);
        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            var keyword = parameters.Search.Trim();
            query = query.Where(i =>
                (i.Name != null && i.Name.Contains(keyword)) ||
                (i.Email != null && i.Email.Contains(keyword)) ||
                (i.Phone != null && i.Phone.Contains(keyword)) ||
                (i.CompanyName != null && i.CompanyName.Contains(keyword)) ||
                (i.TargetTitle != null && i.TargetTitle.Contains(keyword)));
        }

        var page = Math.Max(1, parameters.Page);
        var pageSize = Math.Clamp(parameters.PageSize, 1, 100);
        var totalCount = await query.CountAsync(ct);
        var items = await query.OrderByDescending(i => i.CreatedTime)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<Inquiry> { Items = items, TotalCount = totalCount, Page = page, PageSize = pageSize };
    }

    public Task<bool> HasOpenAsync(Guid memberId, InquiryType type, CancellationToken ct = default) =>
        _dbSet.AnyAsync(i => i.MemberId == memberId && i.Type == type && i.Status != InquiryStatus.Closed, ct);

    public async Task<InquiryCountsResponse> GetCountsAsync(CancellationToken ct = default)
    {
        var groups = await _dbSet.GroupBy(i => i.Status).Select(g => new { Status = g.Key, Count = g.Count() }).ToListAsync(ct);
        return new InquiryCountsResponse
        {
            New = groups.FirstOrDefault(g => g.Status == InquiryStatus.New)?.Count ?? 0,
            InProgress = groups.FirstOrDefault(g => g.Status == InquiryStatus.InProgress)?.Count ?? 0,
            Closed = groups.FirstOrDefault(g => g.Status == InquiryStatus.Closed)?.Count ?? 0,
        };
    }
}
