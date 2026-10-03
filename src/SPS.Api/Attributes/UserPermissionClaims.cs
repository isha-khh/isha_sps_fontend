using System.Security.Claims;
using SPS.Domain.Enums;

namespace SPS.Api.Attributes;

/// <summary>
/// 讀取後台使用者 token 裡的 <c>Permissions</c> claim
/// </summary>
public static class UserPermissionClaims
{
    /// <summary>
    /// 回傳後台權限；不是後台使用者（沒有 Admin 角色）或 claim 無法解析一律回 None。
    /// 一定要先擋掉會員：會員 token 的同名 claim 是 MemberPermission 位元，意義不同
    /// </summary>
    public static UserPermission GetAdminPermissions(this ClaimsPrincipal user)
    {
        if (!user.IsInRole("Admin")) return UserPermission.None;
        return long.TryParse(user.FindFirst("Permissions")?.Value, out var value)
            ? (UserPermission)value
            : UserPermission.None;
    }
}
