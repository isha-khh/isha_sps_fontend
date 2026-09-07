namespace SPS.Domain.Enums;

/// <summary>
/// 實體類型枚舉 - 用于多態關聯
/// </summary>
public enum EntityType
{
    /// <summary>
    /// 新聞
    /// </summary>
    News = 1,

    /// <summary>
    /// 產品
    /// </summary>
    Product = 2,

    /// <summary>
    /// 需求
    /// </summary>
    Demand = 3,

    /// <summary>
    /// 企業
    /// </summary>
    Company = 4
}