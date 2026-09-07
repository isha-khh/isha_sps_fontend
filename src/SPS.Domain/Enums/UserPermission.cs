namespace SPS.Domain.Enums;

/// <summary>
/// 後台使用者權限
/// 前端使用 BigInt 處理 64-bit 位元運算
/// </summary>
[Flags]
public enum UserPermission : long
{
    None = 0,

    // ==================== 系統管理 ====================
    /// <summary>
    /// 用戶管理
    /// </summary>
    ManageUsers = 1L << 0,

    /// <summary>
    /// 角色管理
    /// </summary>
    ManageRoles = 1L << 1,

    /// <summary>
    /// 系統設定
    /// </summary>
    ManageSettings = 1L << 2,

    // ==================== 審核管理 ====================
    /// <summary>
    /// 會員申請審核
    /// </summary>
    ManageApplications = 1L << 10,

    // ==================== 會員管理 ====================
    /// <summary>
    /// 會員管理
    /// </summary>
    ManageMembers = 1L << 20,

    /// <summary>
    /// 企業管理
    /// </summary>
    ManageCompanies = 1L << 21,

    // ==================== 內容管理 ====================
    /// <summary>
    /// 產品管理
    /// </summary>
    ManageProducts = 1L << 30,

    /// <summary>
    /// 需求管理
    /// </summary>
    ManageDemands = 1L << 31,

    /// <summary>
    /// 新聞管理
    /// </summary>
    ManageNews = 1L << 32,

    /// <summary>
    /// 備忘錄管理
    /// </summary>
    ManageMemos = 1L << 33,

    /// <summary>
    /// 分類管理
    /// </summary>
    ManageCategories = 1L << 34,

    /// <summary>
    /// 常見問題管理
    /// </summary>
    ManageQuestions = 1L << 35,

    /// <summary>
    /// 法規管理
    /// </summary>
    ManageRegulations = 1L << 36,

    // ==================== 數據分析 ====================
    /// <summary>
    /// 查看分析報表
    /// </summary>
    ViewAnalytics = 1L << 40,

    // ==================== 客服 ====================
    /// <summary>
    /// 客服權限
    /// </summary>
    CustomerService = 1L << 41,

    // ==================== 通訊管理 ====================
    /// <summary>
    /// 發送群發郵件（建立、寄送、排程、取消郵件活動）
    /// </summary>
    SendBulkEmail = 1L << 50,

    /// <summary>
    /// 寄信紀錄與退信統計
    /// </summary>
    ManageMailLogs = 1L << 51,

    /// <summary>
    /// 信件範本管理
    /// </summary>
    ManageEmailTemplates = 1L << 52,

    // ==================== 系統管理員 ====================
    /// <summary>
    /// 所有權限（系統管理員）
    /// </summary>
    All = ManageUsers | ManageRoles | ManageSettings |
          ManageApplications |
          ManageMembers | ManageCompanies |
          ManageProducts | ManageDemands | ManageNews | ManageMemos |
          ManageCategories | ManageQuestions | ManageRegulations |
          ViewAnalytics | CustomerService |
          SendBulkEmail | ManageMailLogs | ManageEmailTemplates
}