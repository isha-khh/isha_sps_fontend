namespace SPS.Domain.Constants;

/// <summary>
/// JWT 自訂 claim 的名稱。
///
/// 後台使用者與前台會員的 token 各有一個「權限位元」claim，但兩邊是不同的列舉
/// （<see cref="Enums.UserPermission"/> 與 <see cref="Enums.MemberPermission"/>），位元意義互不相干
/// （會員的 ViewCompany = bit0 = 後台的 ManageUsers）。當初兩邊都叫 <c>Permissions</c>，只要有一處讀的時候
/// 沒先確認身分，會員就能冒用後台權限；所以拆成兩個名字，從 token 的來源就不會混在一起。
/// </summary>
public static class AuthClaimTypes
{
    /// <summary>後台使用者的權限（<see cref="Enums.UserPermission"/> 位元）</summary>
    public const string AdminPermissions = "Permissions";

    /// <summary>前台會員的權限（<see cref="Enums.MemberPermission"/> 位元）</summary>
    public const string MemberPermissions = "MemberPermissions";
}
