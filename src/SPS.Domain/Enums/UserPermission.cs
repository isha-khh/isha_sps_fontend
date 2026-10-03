namespace SPS.Domain.Enums;

/// <summary>
/// 後台使用者權限
/// 前端使用 BigInt 處理 64-bit 位元運算
///
/// 新增旗標的規則：
/// 1. 位元不可重用、不可改號（已存進資料庫的 Role.Permissions）。
/// 2. 不要超過 bit 52：<c>PermissionDto.Value</c> 與角色的 permissions 欄位在 JSON 裡是 JS number，
///    2^53 以上會失去精度。
/// 3. 新旗標要同步更新：<c>All</c>、<c>AdminRoleService.GetAllPermissions</c>、AdminWeb 的
///    <c>lib/permissions.ts</c>（含 expandPermissions），並寫 migration 決定現有角色要不要自動補上。
/// 4. 端點用 <c>[RequirePermission(...)]</c> 保護，完整對照見 docs/rbac-permission-design-2026-10-03.md。
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

    /// <summary>
    /// 檢視操作記錄（後台操作日誌、申請日誌）
    /// </summary>
    ViewActionLogs = 1L << 4,

    // ==================== 審核管理 ====================
    /// <summary>
    /// 會員申請審核
    /// </summary>
    ManageApplications = 1L << 10,

    /// <summary>
    /// 檢視會員申請（唯讀）。擁有 <see cref="ManageApplications"/> 自動包含
    /// </summary>
    ViewApplications = 1L << 11,

    // ==================== 會員管理 ====================
    /// <summary>
    /// 會員管理
    /// </summary>
    ManageMembers = 1L << 20,

    /// <summary>
    /// 企業管理
    /// </summary>
    ManageCompanies = 1L << 21,

    /// <summary>
    /// 檢視會員（唯讀，含統計）。擁有 <see cref="ManageMembers"/> 自動包含
    /// </summary>
    ViewMembers = 1L << 22,

    /// <summary>
    /// 檢視企業（唯讀）。擁有 <see cref="ManageCompanies"/> 自動包含
    /// </summary>
    ViewCompanies = 1L << 23,

    /// <summary>
    /// 匯出資料（會員／企業／產品／操作記錄的 Excel）。匯出整批個資比檢視更敏感，獨立成一項；
    /// 匯出會員／企業還需要對應的檢視（或維護）權限
    /// </summary>
    ExportData = 1L << 24,

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

    /// <summary>
    /// 橫幅管理（首頁主視覺、各頁側欄廣告、頂部輪播）
    /// </summary>
    ManageBanners = 1L << 37,

    /// <summary>
    /// 網站內容管理（成功案例、關於我們、彈窗公告、站台計數／統計設定）
    /// </summary>
    ManageSiteContent = 1L << 39,

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

    /// <summary>
    /// 媒體管理（相簿、圖片、影音）
    /// </summary>
    ManageMedia = 1L << 42,

    /// <summary>
    /// 系統檔案管理（檔案總管的搬移、改名、刪除、還原等）。
    /// 上傳與挑選檔案不需要這項，擁有任一內容維護權限即可（編輯公告要能上傳圖片）
    /// </summary>
    ManageFiles = 1L << 45,

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
    All = ManageUsers | ManageRoles | ManageSettings | ViewActionLogs |
          ManageApplications | ViewApplications |
          ManageMembers | ManageCompanies | ViewMembers | ViewCompanies | ExportData |
          ManageProducts | ManageDemands | ManageNews | ManageMemos |
          ManageCategories | ManageQuestions | ManageRegulations |
          ManageBanners | ManageSiteContent | ManageMedia | ManageFiles |
          ViewAnalytics | CustomerService |
          SendBulkEmail | ManageMailLogs | ManageEmailTemplates
}

/// <summary>
/// <see cref="UserPermission"/> 的判斷輔助。後端所有權限檢查都走這裡，避免各處各寫各的。
/// </summary>
public static class UserPermissionExtensions
{
    /// <summary>
    /// 「維護」包含「檢視」：擁有 ManageMembers 就等於同時有 ViewMembers，不用在角色上重複勾選
    /// </summary>
    public static UserPermission Expand(this UserPermission permissions)
    {
        var expanded = permissions;
        if (permissions.HasFlag(UserPermission.ManageApplications)) expanded |= UserPermission.ViewApplications;
        if (permissions.HasFlag(UserPermission.ManageMembers)) expanded |= UserPermission.ViewMembers;
        if (permissions.HasFlag(UserPermission.ManageCompanies)) expanded |= UserPermission.ViewCompanies;
        return expanded;
    }

    /// <summary>
    /// 授權上限：只能把「自己也擁有」的權限授予別人。沒有這條，擁有「角色管理」的人
    /// 可以建一個全權限角色指派給自己，等於 RBAC 形同虛設
    /// </summary>
    public static bool CanGrant(this UserPermission caller, UserPermission target)
        => (target & ~caller.Expand()) == UserPermission.None;

    /// <summary>
    /// 是否擁有指定權限之中的任一項（擁有全部權限的超級管理員一律通過）
    /// </summary>
    public static bool HasAny(this UserPermission permissions, params UserPermission[] required)
    {
        var expanded = permissions.Expand();
        if (expanded.HasFlag(UserPermission.All)) return true;
        return required.Any(r => r != UserPermission.None && expanded.HasFlag(r));
    }
}
