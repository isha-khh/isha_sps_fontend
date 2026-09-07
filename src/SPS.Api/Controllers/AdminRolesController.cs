using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.AdminRole;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Enums;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 後台角色管理控制器
/// </summary>
[ApiController]
[Route("api/admin/roles")]
[Produces("application/json")]
[SwaggerTag("後台角色管理控制器")]
[Authorize]
public class AdminRolesController : ControllerBase
{
    private readonly IAdminRoleService _adminRoleService;
    private readonly ILogger<AdminRolesController> _logger;

    public AdminRolesController(
        IAdminRoleService adminRoleService,
        ILogger<AdminRolesController> logger)
    {
        _adminRoleService = adminRoleService;
        _logger = logger;
    }

    /// <summary>
    /// 獲取所有角色
    /// </summary>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>角色列表</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<RoleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetList(CancellationToken cancellationToken)
    {
        if (!CheckPermission(UserPermission.ManageRoles) && !CheckPermission(UserPermission.ManageUsers)) return Forbid();

        var result = await _adminRoleService.GetAllAsync(cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });

        return Ok(result.Data);
    }

    /// <summary>
    /// 獲取所有權限定義
    /// </summary>
    /// <returns>權限列表</returns>
    [HttpGet("permissions")]
    [ProducesResponseType(typeof(List<PermissionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public IActionResult GetPermissions()
    {
        if (!CheckPermission(UserPermission.ManageRoles)) return Forbid();

        var result = _adminRoleService.GetAllPermissions();
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });

        return Ok(result.Data);
    }

    /// <summary>
    /// 獲取角色詳情
    /// </summary>
    /// <param name="id">角色ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>角色詳情</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(RoleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        if (!CheckPermission(UserPermission.ManageRoles)) return Forbid();

        var result = await _adminRoleService.GetByIdAsync(id, cancellationToken);
        if (!result.IsSuccess) return NotFound(new { error = result.Error });

        return Ok(result.Data);
    }

    /// <summary>
    /// 創建角色
    /// </summary>
    /// <param name="request">創建請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>創建的角色ID</returns>
    [HttpPost]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create([FromBody] CreateRoleRequest request, CancellationToken cancellationToken)
    {
        if (!CheckPermission(UserPermission.ManageRoles)) return Forbid();

        var result = await _adminRoleService.CreateAsync(request, cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });

        return CreatedAtAction(nameof(Get), new { id = result.Data }, result.Data);
    }

    /// <summary>
    /// 更新角色
    /// </summary>
    /// <param name="id">角色ID</param>
    /// <param name="request">更新請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>成功訊息</returns>
    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateRoleRequest request, CancellationToken cancellationToken)
    {
        if (!CheckPermission(UserPermission.ManageRoles)) return Forbid();

        var result = await _adminRoleService.UpdateAsync(id, request, cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });

        return Ok(new { message = "角色更新成功" });
    }

    /// <summary>
    /// 刪除角色
    /// </summary>
    /// <param name="id">角色ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>成功訊息</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        if (!CheckPermission(UserPermission.ManageRoles)) return Forbid();

        var result = await _adminRoleService.DeleteAsync(id, cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });

        return Ok(new { message = "角色刪除成功" });
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
