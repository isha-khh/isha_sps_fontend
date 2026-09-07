using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.AdminUser;
using SPS.Application.DTOs.Common;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Enums;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 後台使用者管理控制器
/// </summary>
[ApiController]
[Route("api/admin/users")]
[Produces("application/json")]
[SwaggerTag("後台使用者管理控制器")]
[Authorize(Roles = "SuperAdmin,Reviewer")]
public class AdminUsersController : ControllerBase
{
    private readonly IAdminUserService _adminUserService;
    private readonly ILogger<AdminUsersController> _logger;

    public AdminUsersController(
        IAdminUserService adminUserService,
        ILogger<AdminUsersController> logger)
    {
        _adminUserService = adminUserService;
        _logger = logger;
    }

    /// <summary>
    /// 獲取後台使用者列表
    /// </summary>
    /// <param name="parameters">查詢參數</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>分頁的使用者列表</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<AdminUserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetList([FromQuery] QueryParameters parameters, CancellationToken cancellationToken)
    {
        if (!CheckPermission(UserPermission.ManageUsers)) return Forbid();

        var result = await _adminUserService.GetPagedAsync(parameters, cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });

        return Ok(result.Data);
    }

    /// <summary>
    /// 獲取後台使用者詳情
    /// </summary>
    /// <param name="id">使用者ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>使用者詳情</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        if (!CheckPermission(UserPermission.ManageUsers)) return Forbid();

        var result = await _adminUserService.GetByIdAsync(id, cancellationToken);
        if (!result.IsSuccess) return NotFound(new { error = result.Error });

        return Ok(result.Data);
    }

    /// <summary>
    /// 創建後台使用者
    /// </summary>
    /// <param name="request">創建請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>創建的使用者ID</returns>
    [HttpPost]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create([FromBody] CreateAdminUserRequest request, CancellationToken cancellationToken)
    {
        if (!CheckPermission(UserPermission.ManageUsers)) return Forbid();

        var result = await _adminUserService.CreateAsync(request, cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });

        return CreatedAtAction(nameof(Get), new { id = result.Data }, result.Data);
    }

    /// <summary>
    /// 更新使用者權限（角色）
    /// </summary>
    /// <param name="id">使用者ID</param>
    /// <param name="request">更新請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>成功訊息</returns>
    [HttpPut("{id}/permissions")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdatePermissions(Guid id, [FromBody] UpdateAdminPermissionsRequest request, CancellationToken cancellationToken)
    {
        if (!CheckPermission(UserPermission.ManageUsers)) return Forbid();

        var result = await _adminUserService.UpdatePermissionsAsync(id, request, cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });

        return Ok(new { message = "權限更新成功" });
    }

    /// <summary>
    /// 更新使用者狀態（停用/啟用）
    /// </summary>
    /// <param name="id">使用者ID</param>
    /// <param name="request">更新請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>成功訊息</returns>
    [HttpPut("{id}/status")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateAdminUserStatusRequest request, CancellationToken cancellationToken)
    {
        if (!CheckPermission(UserPermission.ManageUsers)) return Forbid();

        var result = await _adminUserService.UpdateStatusAsync(id, request, cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });

        return Ok(new { message = "狀態更新成功" });
    }

    private bool CheckPermission(UserPermission requiredPermission)
    {
        var permissionsStr = User.FindFirst("Permissions")?.Value;
        if (long.TryParse(permissionsStr, out var perms))
        {
            var userPermissions = (UserPermission)perms;
            if (userPermissions.HasFlag(UserPermission.All)) return true;
            return userPermissions.HasFlag(requiredPermission);
        }
        return false;
    }
}
