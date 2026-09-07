using Microsoft.EntityFrameworkCore;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Domain.Enums;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Repositories.Common;

namespace SPS.Infrastructure.Repositories;

/// <summary>
/// 會員申請倉儲實現
/// </summary>
public class ApplicationRepository : Repository<MemberApplication, Guid>, IApplicationRepository
{
    public ApplicationRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<MemberApplication?> GetDetailByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(a => a.Reviewer)
            .Include(a => a.Company)
            .Include(a => a.Documents)
            .Include(a => a.Logs)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
    }

    public async Task<List<MemberApplication>> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(a => a.Email == email)
            .OrderByDescending(a => a.CreatedTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<MemberApplication?> GetByApplicationNumberAsync(string applicationNumber, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(a => a.ApplicationNumber == applicationNumber, cancellationToken);
    }

    public async Task<List<MemberApplication>> GetByStatusAsync(ApplicationStatus status, int pageIndex = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(a => a.Reviewer)
            .Include(a => a.ApplicationMembers)
            .Where(a => a.Status == status)
            .OrderByDescending(a => a.CreatedTime)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<MemberApplication>> GetByStatusesAsync(IEnumerable<ApplicationStatus> statuses, int pageIndex = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var statusList = statuses.ToList();
        return await _dbSet
            .Include(a => a.Reviewer)
            .Include(a => a.ApplicationMembers)
            .Where(a => statusList.Contains(a.Status))
            .OrderByDescending(a => a.ReviewedAt ?? a.CreatedTime)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountByStatusesAsync(IEnumerable<ApplicationStatus> statuses, CancellationToken cancellationToken = default)
    {
        var statusList = statuses.ToList();
        return await _dbSet
            .Where(a => statusList.Contains(a.Status))
            .CountAsync(cancellationToken);
    }

    public async Task<int> CountByStatusAsync(ApplicationStatus status, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(a => a.Status == status)
            .CountAsync(cancellationToken);
    }

    public async Task<List<MemberApplication>> GetByReviewerIdAsync(Guid reviewerId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(a => a.ReviewerId == reviewerId)
            .OrderByDescending(a => a.ReviewStartedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Dictionary<ApplicationStatus, int>> GetStatisticsAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .GroupBy(a => a.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Status, x => x.Count, cancellationToken);
    }

    public async Task<bool> HasPendingApplicationAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AnyAsync(a => a.Email == email &&
                          (a.Status == ApplicationStatus.PendingReview ||
                           a.Status == ApplicationStatus.UnderReview),
                      cancellationToken);
    }

    public async Task<bool> IsUnifiedSocialCreditCodeRegisteredAsync(string unifiedSocialCreditCode, CancellationToken cancellationToken = default)
    {
        return await _context.Companies
            .AnyAsync(c => c.UnifiedSocialCreditCode == unifiedSocialCreditCode, cancellationToken);
    }
}
