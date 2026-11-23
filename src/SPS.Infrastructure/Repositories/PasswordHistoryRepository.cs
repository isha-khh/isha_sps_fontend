using Microsoft.EntityFrameworkCore;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Repositories.Common;

namespace SPS.Infrastructure.Repositories;

public class PasswordHistoryRepository : Repository<PasswordHistory, Guid>, IPasswordHistoryRepository
{
    public PasswordHistoryRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<PasswordHistory>> GetRecentByMemberAsync(Guid memberId, int count, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(p => p.MemberId == memberId)
            .OrderByDescending(p => p.CreatedTime)
            .Take(count)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<PasswordHistory>> GetRecentByUserAsync(Guid userId, int count, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.CreatedTime)
            .Take(count)
            .ToListAsync(cancellationToken);
    }
}
