namespace SPS.Domain.Enums;

/// <summary>
/// 前台會員權限
/// </summary>
[Flags]
public enum MemberPermission : long
{
    None = 0,

    // ==================== 公司資料 ====================
    /// <summary>
    /// 查看公司資料
    /// </summary>
    ViewCompany = 1L << 0,

    /// <summary>
    /// 編輯公司資料
    /// </summary>
    EditCompany = 1L << 1,

    // ==================== 產品管理（供給端）====================
    /// <summary>
    /// 查看產品
    /// </summary>
    ViewProduct = 1L << 10,

    /// <summary>
    /// 新增產品
    /// </summary>
    CreateProduct = 1L << 11,

    /// <summary>
    /// 編輯產品
    /// </summary>
    EditProduct = 1L << 12,

    /// <summary>
    /// 刪除產品
    /// </summary>
    DeleteProduct = 1L << 13,

    // ==================== 需求管理（需求端）====================
    /// <summary>
    /// 查看需求
    /// </summary>
    ViewDemand = 1L << 20,

    /// <summary>
    /// 新增需求
    /// </summary>
    CreateDemand = 1L << 21,

    /// <summary>
    /// 編輯需求
    /// </summary>
    EditDemand = 1L << 22,

    /// <summary>
    /// 刪除需求
    /// </summary>
    DeleteDemand = 1L << 23,

    // ==================== 組合權限 ====================
    /// <summary>
    /// 供給端經理：所有權限（公司資料 + 產品管理）
    /// </summary>
    SupplierManager = ViewCompany | EditCompany | ViewProduct | CreateProduct | EditProduct | DeleteProduct,

    /// <summary>
    /// 供給端員工：產品維護權限
    /// </summary>
    SupplierEmployee = ViewProduct | CreateProduct | EditProduct | DeleteProduct,

    /// <summary>
    /// 需求端經理：所有權限（公司資料 + 需求管理）
    /// </summary>
    BuyerManager = ViewCompany | EditCompany | ViewDemand | CreateDemand | EditDemand | DeleteDemand,

    /// <summary>
    /// 需求端員工：需求維護權限
    /// </summary>
    BuyerEmployee = ViewDemand | CreateDemand | EditDemand | DeleteDemand
}