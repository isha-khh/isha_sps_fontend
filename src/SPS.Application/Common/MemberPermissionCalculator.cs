using SPS.Domain.Enums;

namespace SPS.Application.Common;

/// <summary>
/// 依企業角色（供給端／需求端）與成員身分（擁有者＝Manager、一般成員＝Employee）計算前台會員權限。
/// 審核通過、經理在會員中心新增成員、後台調整成員身分都用這一份，避免各處各寫一套造成權限不一致（issue #81）。
/// </summary>
public static class MemberPermissionCalculator
{
    public static MemberPermission Calculate(MemberRole role, MemberPosition position)
    {
        return (role, position) switch
        {
            (MemberRole.Supplier, MemberPosition.Manager) => MemberPermission.SupplierManager,
            (MemberRole.Supplier, MemberPosition.Employee) => MemberPermission.SupplierEmployee,
            (MemberRole.Buyer, MemberPosition.Manager) => MemberPermission.BuyerManager,
            (MemberRole.Buyer, MemberPosition.Employee) => MemberPermission.BuyerEmployee,
            _ => MemberPermission.None
        };
    }
}
