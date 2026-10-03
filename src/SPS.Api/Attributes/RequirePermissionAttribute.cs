using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using SPS.Domain.Constants;
using SPS.Domain.Enums;

namespace SPS.Api.Attributes;

/// <summary>
/// 後台權限驗證（RBAC）：要求呼叫者是後台使用者，且角色合併後的權限包含指定權限之中的<b>任一項</b>。
///
/// 一個端點可以疊多個此屬性，之間是 AND（例如匯出會員要同時有 <see cref="UserPermission.ExportData"/>
/// 與檢視會員）；同一個屬性裡列多個權限是 OR（例如挑選檔案時任一內容維護權限都行）。
/// 「維護包含檢視」「擁有全部權限者一律通過」的規則在 <see cref="UserPermissionExtensions"/>。
///
/// 為什麼不只靠 <c>[Authorize(Roles = "Admin")]</c>：那只能分「是不是後台使用者」，分不出後台使用者之間的差別。
/// 為什麼一定要同時檢查後台身分：會員 token 也有 <c>Permissions</c> claim，但它是 MemberPermission 位元，
/// 與 UserPermission 同名不同義（會員的 ViewCompany = bit0 = 這裡的 ManageUsers），所以只看位元會被會員冒用。
///
/// 權限來自登入時簽進 token 的 <c>Permissions</c> claim，角色權限被改動後，要使用者重新登入或 refresh 才會生效。
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public class RequirePermissionAttribute : Attribute, IAuthorizationFilter
{
    private readonly UserPermission[] _anyOf;

    public RequirePermissionAttribute(params UserPermission[] anyOf)
    {
        if (anyOf.Length == 0)
            throw new ArgumentException("至少要指定一個權限", nameof(anyOf));
        _anyOf = anyOf;
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;

        if (user.Identity?.IsAuthenticated != true)
        {
            context.Result = new UnauthorizedObjectResult(new { error = "未登入" });
            return;
        }

        // 後台使用者的 token 一定帶 Admin 角色（TokenService）；會員 token 沒有
        if (!user.IsInRole("Admin"))
        {
            context.Result = Forbidden("無後台權限");
            return;
        }

        var claim = user.FindFirst(AuthClaimTypes.AdminPermissions)?.Value;
        if (!long.TryParse(claim, out var value) || !((UserPermission)value).HasAny(_anyOf))
        {
            var names = string.Join("、", _anyOf.Select(p => p.ToString()));
            context.Result = Forbidden($"權限不足，需要下列任一權限：{names}");
        }
    }

    private static ObjectResult Forbidden(string message) =>
        new(new { error = message }) { StatusCode = StatusCodes.Status403Forbidden };
}
