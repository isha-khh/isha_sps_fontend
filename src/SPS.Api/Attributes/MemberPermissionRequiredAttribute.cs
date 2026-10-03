using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using SPS.Domain.Enums;

namespace SPS.Api.Attributes;

/// <summary>
/// 前台會員權限驗證特性
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public class MemberPermissionRequiredAttribute : Attribute, IAuthorizationFilter
{
    private readonly MemberPermission _requiredPermission;

    public MemberPermissionRequiredAttribute(MemberPermission permission)
    {
        _requiredPermission = permission;
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;

        // 檢查是否已認證
        if (!user.Identity?.IsAuthenticated ?? true)
        {
            context.Result = new UnauthorizedObjectResult(new { error = "未登入" });
            return;
        }

        // 檢查是否是前台會員（有 MemberId claim）
        var memberIdClaim = user.FindFirst("MemberId");
        if (memberIdClaim == null)
        {
            context.Result = new UnauthorizedObjectResult(new { error = "無效的會員身份" });
            return;
        }

        // 獲取會員權限（讀 MemberPermissions；不是會員、或帶 Admin 角色的 token 讀不到，視為權限不足）
        var memberPermissions = user.GetMemberPermissions();
        if (memberPermissions == null)
        {
            context.Result = new ForbidResult();
            return;
        }

        // 檢查是否有所需權限
        if (!memberPermissions.Value.HasFlag(_requiredPermission))
        {
            context.Result = new ObjectResult(new { error = "權限不足" })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
            return;
        }
    }
}
