using SPS.Application.DTOs.Common;
using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IRepositories;

/// <summary>
/// 後台使用者倉儲接口
/// </summary>
public interface IUserRepository
{
    /// <summary>
    /// 分頁查詢使用者列表
    /// </summary>
    Task<PagedResult<User>> GetPagedAsync(QueryParameters parameters, CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據ID獲取使用者
    /// </summary>
    Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據帳號獲取使用者
    /// </summary>
    Task<User?> GetByAccountAsync(string account, CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據郵箱獲取使用者
    /// </summary>
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);

    /// <summary>
    /// 檢查帳號是否已存在
    /// </summary>
    Task<bool> ExistsByAccountAsync(string account, CancellationToken cancellationToken = default);

    /// <summary>
    /// 檢查郵箱是否已存在
    /// </summary>
    Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取使用者總數
    /// </summary>
    Task<int> GetCountAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據ID獲取使用者（包含角色）
    /// </summary>
    Task<User?> GetByIdWithRolesAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// 添加使用者
    /// </summary>
    Task<User> AddAsync(User user, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新使用者
    /// </summary>
    Task UpdateAsync(User user, CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除使用者
    /// </summary>
    Task DeleteAsync(User user, CancellationToken cancellationToken = default);
}