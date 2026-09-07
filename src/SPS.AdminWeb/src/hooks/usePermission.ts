import { useMemo } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import {
  Permission,
  calculateUserPermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from '@/lib/permissions';

/**
 * 權限檢查 Hook
 */
export function usePermission() {
  const user = useAuthStore((state) => state.user);

  const userPermissions = useMemo(() => {
    if (!user?.roles) return 0n;
    return calculateUserPermissions(user.roles);
  }, [user?.roles]);

  return {
    /** 使用者的權限位掩碼 */
    permissions: userPermissions,

    /** 檢查是否有指定權限 */
    has: (permission: bigint) => hasPermission(userPermissions, permission),

    /** 檢查是否有任一指定權限 */
    hasAny: (permissions: bigint[]) => hasAnyPermission(userPermissions, permissions),

    /** 檢查是否有所有指定權限 */
    hasAll: (permissions: bigint[]) => hasAllPermissions(userPermissions, permissions),

    /** 是否為超級管理員 (擁有所有權限) */
    isSuperAdmin: () => {
      const allPermissions = Object.values(Permission).reduce((acc, p) => acc | p, 0n);
      return (userPermissions & allPermissions) === allPermissions;
    },
  };
}

/**
 * 權限常量重新導出
 */
export { Permission } from '@/lib/permissions';
