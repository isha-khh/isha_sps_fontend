using System.Security.Claims;
using SPS.Domain.Constants;
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
        return long.TryParse(user.FindFirst(AuthClaimTypes.AdminPermissions)?.Value, out var value)
            ? (UserPermission)value
            : UserPermission.None;
    }

    /// <summary>
    /// 讀取前台會員 token 裡的權限。不是會員（沒有 <c>MemberId</c> claim）、或是後台使用者（有 Admin 角色）一律回 null。
    ///
    /// 過渡期相容：改名之前簽發的會員 token 還在有效期內，權限放在舊名稱 <c>Permissions</c>。
    /// 只有「有 MemberId、沒有 Admin 角色」的 token 才會退回讀舊名稱，所以不會讓後台 token 的權限被當成會員權限。
    /// 所有舊 token 過期後（access token 最長 <c>JWT_Setting__Expires</c> 分鐘，並且 refresh 會重簽成新名稱）
    /// 就可以把下面這個退回讀舊名稱的分支刪掉。
    /// </summary>
    public static MemberPermission? GetMemberPermissions(this ClaimsPrincipal user)
    {
        if (user.FindFirst("MemberId") == null || user.IsInRole("Admin")) return null;

        var raw = user.FindFirst(AuthClaimTypes.MemberPermissions)?.Value
                  ?? user.FindFirst(AuthClaimTypes.AdminPermissions)?.Value; // 過渡期：舊 token
        return long.TryParse(raw, out var value) ? (MemberPermission)value : null;
    }
}
