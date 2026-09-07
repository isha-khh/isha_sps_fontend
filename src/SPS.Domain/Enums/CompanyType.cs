namespace SPS.Domain.Enums;

public enum CompanyType : short
{
    /// <summary>
    /// 供給端
    /// </summary>
    Supplier = 1,

    /// <summary>
    /// 需求端
    /// </summary>
    Buyer = 2,

    /// <summary>
    /// 供需雙方
    /// </summary>
    Both = 3
}
