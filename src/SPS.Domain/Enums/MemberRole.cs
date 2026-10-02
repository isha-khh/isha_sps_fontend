namespace SPS.Domain.Enums;

/// <summary>
/// 會員角色（前台系統）
/// </summary>
public enum MemberRole
{
    /// <summary>
    /// 尚未選擇角色 - 個人會員專用，個人會員不隸屬需求/供給任何一端
    /// </summary>
    None = 0,

    /// <summary>
    /// 供給端 - 提供產品/服務的企業
    /// </summary>
    Supplier = 1,

    /// <summary>
    /// 需求端 - 采購產品/服務的企業
    /// </summary>
    Buyer = 2
}
