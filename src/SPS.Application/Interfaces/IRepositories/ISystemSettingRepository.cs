using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IRepositories;

public interface ISystemSettingRepository : IRepository<SystemSetting, int>
{
    /// <summary>
    /// 根據分類獲取設定
    /// </summary>
    Task<SystemSetting?> GetByCategoryAsync(string category, CancellationToken cancellationToken = default);
}
