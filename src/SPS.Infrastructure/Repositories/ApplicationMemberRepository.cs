using Microsoft.EntityFrameworkCore;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Domain.Enums;
using SPS.Infrastructure.Data;

namespace SPS.Infrastructure.Repositories;

/// <summary>
/// 申請成員 Repository 實現
/// </summary>
public class ApplicationMemberRepository : IApplicationMemberRepository
{
    private readonly ApplicationDbContext _context;

    public ApplicationMemberRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApplicationMember?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.ApplicationMembers
            .FirstOrDefaultAsync(am => am.Id == id, ct);
    }

    public async Task<List<ApplicationMember>> GetByApplicationIdAsync(
        Guid applicationId,
        CancellationToken ct = default)
    {
        return await _context.ApplicationMembers
            .Where(am => am.ApplicationId == applicationId)
            .OrderBy(am => am.OrderIndex)
            .ToListAsync(ct);
    }

    public async Task<ApplicationMember?> GetByEmailAsync(string email, CancellationToken ct = default)
    {
        return await _context.ApplicationMembers
            .FirstOrDefaultAsync(am => am.Email == email, ct);
    }

    public async Task<bool> ExistsByEmailAsync(string email, CancellationToken ct = default)
    {
        // 檢查 Email 是否已在 Members 表中存在
        var existsInMembers = await _context.Members
            .AnyAsync(m => m.Email == email, ct);
        if (existsInMembers) return true;

        // 檢查 Email 是否已在 ApplicationMembers 表中存在（排除草稿和已退回的申請）
        var existsInApplicationMembers = await _context.ApplicationMembers
            .AnyAsync(am => am.Email == email
                && am.Application.Status != ApplicationStatus.Draft
                && am.Application.Status != ApplicationStatus.Rejected, ct);

        return existsInApplicationMembers;
    }

    public async Task<bool> ExistsByEmailInApplicationAsync(
        Guid applicationId,
        string email,
        CancellationToken ct = default)
    {
        return await _context.ApplicationMembers
            .AnyAsync(am => am.ApplicationId == applicationId && am.Email == email, ct);
    }

    public async Task<int> CountByApplicationIdAsync(
        Guid applicationId,
        CancellationToken ct = default)
    {
        return await _context.ApplicationMembers
            .CountAsync(am => am.ApplicationId == applicationId, ct);
    }

    public async Task<ApplicationMember> AddAsync(ApplicationMember member, CancellationToken ct = default)
    {
        await _context.ApplicationMembers.AddAsync(member, ct);
        return member;
    }

    public Task UpdateAsync(ApplicationMember member, CancellationToken ct = default)
    {
        _context.ApplicationMembers.Update(member);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(ApplicationMember member, CancellationToken ct = default)
    {
        _context.ApplicationMembers.Remove(member);
        return Task.CompletedTask;
    }
}
