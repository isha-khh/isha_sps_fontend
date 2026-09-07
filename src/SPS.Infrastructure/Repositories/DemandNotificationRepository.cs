using Microsoft.EntityFrameworkCore;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Repositories.Common;

namespace SPS.Infrastructure.Repositories;

public class DemandNotificationRepository : Repository<DemandNotification, int>, IDemandNotificationRepository
{
    public DemandNotificationRepository(ApplicationDbContext context) : base(context) { }

    public async Task<List<DemandNotification>> GetByDemandIdAsync(int demandId, CancellationToken ct = default) =>
        await _dbSet
            .Where(n => n.DemandId == demandId)
            .OrderBy(n => n.CreatedTime)
            .ToListAsync(ct);
}
