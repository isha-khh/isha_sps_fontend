using Microsoft.EntityFrameworkCore;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Repositories.Common;

namespace SPS.Infrastructure.Repositories;

/// <summary>
/// 申請日志倉儲實現
/// </summary>
public class ApplicationLogRepository : Repository<ApplicationLog, Guid>, IApplicationLogRepository
{
    public ApplicationLogRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<ApplicationLog>> GetByApplicationIdAsync(Guid applicationId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(l => l.ApplicationId == applicationId)
            .OrderByDescending(l => l.OperatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task AddLogAsync(ApplicationLog log, CancellationToken cancellationToken = default)
    {
        await _dbSet.AddAsync(log, cancellationToken);
    }
}
