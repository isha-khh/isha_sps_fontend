using SPS.Application.Common;
using SPS.Application.DTOs.AdminUser;
using SPS.Application.DTOs.Common;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 後台使用者管理服務接口
/// </summary>
public interface IAdminUserService
{
    /// <summary>
    /// 獲取分頁列表
    /// </summary>
    Task<Result<PagedResult<AdminUserDto>>> GetPagedAsync(QueryParameters parameters, CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取詳情
    /// </summary>
    Task<Result<AdminUserDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// 創建後台使用者
    /// </summary>
    Task<Result<Guid>> CreateAsync(CreateAdminUserRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新權限（角色）
    /// </summary>
    Task<Result<bool>> UpdatePermissionsAsync(Guid id, UpdateAdminPermissionsRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新狀態（停用/啟用）
    /// </summary>
    Task<Result<bool>> UpdateStatusAsync(Guid id, UpdateAdminUserStatusRequest request, CancellationToken cancellationToken = default);
}
