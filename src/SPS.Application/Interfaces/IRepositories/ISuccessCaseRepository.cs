using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IRepositories;

/// <summary>
/// 成功案例倉儲接口
/// </summary>
public interface ISuccessCaseRepository : IRepository<SuccessCase, int>
{
    /// <summary>
    /// 根據產業獲取成功案例列表
    /// </summary>
    Task<List<SuccessCase>> GetByIndustryAsync(string industry);

    /// <summary>
    /// 根據標籤獲取成功案例列表
    /// </summary>
    Task<List<SuccessCase>> GetByTagAsync(string tag);

    /// <summary>
    /// 獲取已發布的成功案例列表
    /// </summary>
    Task<List<SuccessCase>> GetPublishedAsync();

    /// <summary>
    /// 增加瀏覽次數
    /// </summary>
    Task IncrementViewCountAsync(int id);
}
