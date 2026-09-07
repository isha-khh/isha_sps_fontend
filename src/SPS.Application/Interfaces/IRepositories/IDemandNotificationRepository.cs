using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IRepositories;

public interface IDemandNotificationRepository : IRepository<DemandNotification, int>
{
    Task<List<DemandNotification>> GetByDemandIdAsync(int demandId, CancellationToken ct = default);
}
