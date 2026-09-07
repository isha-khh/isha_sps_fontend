/**
 * 權限常量定義 - 對應後端 UserPermission 枚舉
 */
export const Permission = {
  // 系統管理
  ManageUsers: 1n << 0n,
  ManageRoles: 1n << 1n,
  ManageSettings: 1n << 2n,

  // 審核管理
  ManageApplications: 1n << 10n,

  // 會員管理
  ManageMembers: 1n << 20n,
  ManageCompanies: 1n << 21n,

  // 內容管理
  ManageProducts: 1n << 30n,
  ManageDemands: 1n << 31n,
  ManageNews: 1n << 32n,
  ManageMemos: 1n << 33n,
  ManageCategories: 1n << 34n,
  ManageQuestions: 1n << 35n,
  ManageRegulations: 1n << 36n,

  // 數據分析
  ViewAnalytics: 1n << 40n,

  // 客服
  CustomerService: 1n << 41n,

  // 通訊管理
  SendBulkEmail: 1n << 50n,
  ManageMailLogs: 1n << 51n,
  ManageEmailTemplates: 1n << 52n,
} as const;

export type PermissionKey = keyof typeof Permission;

/**
 * 從使用者角色中計算總權限
 */
export function calculateUserPermissions(roles: { permissions: string }[]): bigint {
  if (!roles || roles.length === 0) return 0n;

  return roles.reduce((acc, role) => {
    try {
      return acc | BigInt(role.permissions);
    } catch {
      return acc;
    }
  }, 0n);
}

/**
 * 檢查是否有指定權限
 */
export function hasPermission(userPermissions: bigint, requiredPermission: bigint): boolean {
  // 如果有所有權限 (All)，直接返回 true
  const allPermissions = Object.values(Permission).reduce((acc, p) => acc | p, 0n);
  if ((userPermissions & allPermissions) === allPermissions) {
    return true;
  }
  return (userPermissions & requiredPermission) === requiredPermission;
}

/**
 * 檢查是否有任一指定權限
 */
export function hasAnyPermission(userPermissions: bigint, requiredPermissions: bigint[]): boolean {
  return requiredPermissions.some((p) => hasPermission(userPermissions, p));
}

/**
 * 檢查是否有所有指定權限
 */
export function hasAllPermissions(userPermissions: bigint, requiredPermissions: bigint[]): boolean {
  return requiredPermissions.every((p) => hasPermission(userPermissions, p));
}

/**
 * 權限名稱對應表
 */
export const PermissionLabels: Record<PermissionKey, string> = {
  ManageUsers: '用戶管理',
  ManageRoles: '角色管理',
  ManageSettings: '系統設定',
  ManageApplications: '會員申請審核',
  ManageMembers: '會員管理',
  ManageCompanies: '企業管理',
  ManageProducts: '產品管理',
  ManageDemands: '需求管理',
  ManageNews: '新聞管理',
  ManageMemos: '備忘錄管理',
  ManageCategories: '分類管理',
  ManageQuestions: '常見問題管理',
  ManageRegulations: '法規管理',
  ViewAnalytics: '查看分析報表',
  CustomerService: '客服服務',
  SendBulkEmail: '發送群發郵件',
  ManageMailLogs: '寄信紀錄與退信',
  ManageEmailTemplates: '信件範本管理',
};
