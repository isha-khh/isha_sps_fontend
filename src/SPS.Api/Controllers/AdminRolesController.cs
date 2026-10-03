using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.AdminRole;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Enums;
using Swashbuckle.AspNetCore.Annotations;
using SPS.Api.Attributes;

namespace SPS.Api.Controllers;

/// <summary>
/// 後台角色管理控制器
/// </summary>
[ApiController]
[Route("api/admin/roles")]
[Produces("application/json")]
[SwaggerTag("後台角色管理控制器")]
[Authorize(Roles = "Admin")]
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
    [RequirePermission(UserPermission.ManageRoles, UserPermission.ManageUsers)]
    [ProducesResponseType(typeof(List<RoleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetList(CancellationToken cancellationToken)
    {
        var result = await _adminRoleService.GetAllAsync(cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });

        return Ok(result.Data);
    }

    /// <summary>
    /// 獲取所有權限定義
    /// </summary>
    /// <returns>權限列表</returns>
    [HttpGet("permissions")]
    [RequirePermission(UserPermission.ManageRoles)]
    [ProducesResponseType(typeof(List<PermissionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public IActionResult GetPermissions()
    {
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
    [RequirePermission(UserPermission.ManageRoles)]
    [ProducesResponseType(typeof(RoleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
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
    [RequirePermission(UserPermission.ManageRoles)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create([FromBody] CreateRoleRequest request, CancellationToken cancellationToken)
    {
        var denied = CheckGrantable(request.Permissions);
        if (denied != null) return denied;

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
    [RequirePermission(UserPermission.ManageRoles)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateRoleRequest request, CancellationToken cancellationToken)
    {
        var denied = CheckGrantable(request.Permissions);
        if (denied != null) return denied;

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
    [RequirePermission(UserPermission.ManageRoles)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await _adminRoleService.DeleteAsync(id, cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });

        return Ok(new { message = "角色刪除成功" });
    }

    /// <summary>
    /// 角色的權限只能是操作者自己也擁有的子集，且不能含未定義的位元
    /// </summary>
    private IActionResult? CheckGrantable(UserPermission requested)
    {
        if ((requested & ~UserPermission.All) != UserPermission.None)
            return BadRequest(new { error = "包含未定義的權限" });

        if (!User.GetAdminPermissions().CanGrant(requested))
            return StatusCode(StatusCodes.Status403Forbidden, new { error = "不能授予自己沒有的權限" });

        return null;
    }
}
