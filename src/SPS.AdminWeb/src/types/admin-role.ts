// Admin Role related types based on backend DTOs
// 注意：permissions 使用 string 來保存 64-bit 整數，避免 JavaScript number 精度問題

export interface RoleDto {
  id: string;
  name: string;
  description?: string;
  permissions: number; // 從 API 返回的是 number，但可能是大數
  createdTime: string;
  updatedTime: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissions: string; // 發送給 API 時用 string 避免精度問題
}

export interface UpdateRoleRequest {
  name: string;
  description?: string;
  permissions: string; // 發送給 API 時用 string 避免精度問題
}

export interface PermissionDto {
  name: string;
  value: number; // 從 API 返回的權限值
  description: string;
  group: string;
}

export interface PermissionsListResponse {
  permissions: PermissionDto[];
}

// ============ BigInt 工具函數 ============

/**
 * 將權限位掩碼轉換為權限值陣列 (使用 BigInt)
 */
export function permissionBitmaskToArray(bitmask: number | bigint, permissions: PermissionDto[]): bigint[] {
  const mask = BigInt(bitmask);
  const result: bigint[] = [];
  permissions.forEach((perm) => {
    const permValue = BigInt(perm.value);
    if ((mask & permValue) === permValue && permValue !== 0n) {
      result.push(permValue);
    }
  });
  return result;
}

/**
 * 將權限值陣列轉換為位掩碼 (使用 BigInt)
 */
export function permissionArrayToBitmask(permissions: bigint[]): bigint {
  return permissions.reduce((acc, val) => acc | val, 0n);
}

/**
 * 檢查是否有某權限
 */
export function hasPermission(bitmask: number | bigint, permValue: number | bigint): boolean {
  const mask = BigInt(bitmask);
  const perm = BigInt(permValue);
  return (mask & perm) === perm;
}
