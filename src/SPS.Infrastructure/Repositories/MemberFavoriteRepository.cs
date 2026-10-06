using Microsoft.EntityFrameworkCore;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Infrastructure.Data;

namespace SPS.Infrastructure.Repositories;

public class MemberFavoriteRepository : IMemberFavoriteRepository
{
    private readonly ApplicationDbContext _context;

    public MemberFavoriteRepository(ApplicationDbContext context) => _context = context;

    public Task<List<Guid>> GetCompanyIdsAsync(Guid memberId, CancellationToken ct = default) =>
        _context.MemberFavorites.Where(f => f.MemberId == memberId).Select(f => f.CompanyId).ToListAsync(ct);

    public Task<List<int>> GetDemandIdsAsync(Guid memberId, CancellationToken ct = default) =>
        _context.MemberDemands.Where(d => d.MemberId == memberId).Select(d => d.DemandId).ToListAsync(ct);

    public async Task<int> CountAsync(Guid memberId, CancellationToken ct = default) =>
        await _context.MemberFavorites.CountAsync(f => f.MemberId == memberId, ct) +
        await _context.MemberDemands.CountAsync(d => d.MemberId == memberId, ct);

    public async Task<bool> AddCompanyAsync(Guid memberId, Guid companyId, CancellationToken ct = default)
    {
        if (await _context.MemberFavorites.AnyAsync(f => f.MemberId == memberId && f.CompanyId == companyId, ct)) return false;
        _context.MemberFavorites.Add(new MemberFavorite { MemberId = memberId, CompanyId = companyId });
        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task RemoveCompanyAsync(Guid memberId, Guid companyId, CancellationToken ct = default) =>
        await _context.MemberFavorites.Where(f => f.MemberId == memberId && f.CompanyId == companyId).ExecuteDeleteAsync(ct);

    public async Task<bool> AddDemandAsync(Guid memberId, int demandId, CancellationToken ct = default)
    {
        if (await _context.MemberDemands.AnyAsync(d => d.MemberId == memberId && d.DemandId == demandId, ct)) return false;
        _context.MemberDemands.Add(new MemberDemand { MemberId = memberId, DemandId = demandId });
        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task RemoveDemandAsync(Guid memberId, int demandId, CancellationToken ct = default) =>
        await _context.MemberDemands.Where(d => d.MemberId == memberId && d.DemandId == demandId).ExecuteDeleteAsync(ct);
}
