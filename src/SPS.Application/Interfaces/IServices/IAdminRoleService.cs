using SPS.Application.Common;
using SPS.Application.DTOs.AdminRole;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 後台角色管理服務接口
/// </summary>
public interface IAdminRoleService
{
    /// <summary>
    /// 獲取所有角色
    /// </summary>
    Task<Result<List<RoleDto>>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取角色詳情
    /// </summary>
    Task<Result<RoleDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// 創建角色
    /// </summary>
    Task<Result<Guid>> CreateAsync(CreateRoleRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新角色
    /// </summary>
    Task<Result<bool>> UpdateAsync(Guid id, UpdateRoleRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除角色
    /// </summary>
    Task<Result<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取所有權限定義
    /// </summary>
    Result<List<PermissionDto>> GetAllPermissions();
}
