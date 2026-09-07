using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IRepositories;

/// <summary>
/// 申請日志倉儲接口
/// </summary>
public interface IApplicationLogRepository : IRepository<ApplicationLog, Guid>
{
    /// <summary>
    /// 根據申請ID獲取日志列表
    /// </summary>
    Task<List<ApplicationLog>> GetByApplicationIdAsync(
        Guid applicationId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 添加日志
    /// </summary>
    Task AddLogAsync(
        ApplicationLog log,
        CancellationToken cancellationToken = default);
}
