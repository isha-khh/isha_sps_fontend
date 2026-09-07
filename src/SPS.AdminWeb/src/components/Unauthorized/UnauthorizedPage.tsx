import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { usePermission } from '@/hooks/usePermission';
import { PermissionLabels, Permission } from '@/lib/permissions';

interface UnauthorizedPageProps {
  /** 缺少的權限 (可選，用於顯示具體缺少哪些權限) */
  requiredPermissions?: bigint[];
}

const UnauthorizedPage = ({ requiredPermissions }: UnauthorizedPageProps) => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { permissions: userPermissions } = usePermission();

  // 取得缺少的權限名稱
  const getMissingPermissionLabels = (): string[] => {
    if (!requiredPermissions) return [];

    const missing: string[] = [];
    for (const [key, value] of Object.entries(Permission)) {
      if (requiredPermissions.includes(value as bigint)) {
        if ((userPermissions & (value as bigint)) !== (value as bigint)) {
          missing.push(PermissionLabels[key as keyof typeof PermissionLabels]);
        }
      }
    }
    return missing;
  };

  const missingPermissions = getMissingPermissionLabels();

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="card w-full max-w-lg bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          {/* Icon */}
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-error/10 flex items-center justify-center">
              <span className="iconify lucide--shield-x size-12 text-error" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-6xl font-bold text-error">403</h1>
          <h2 className="text-2xl font-bold mt-2">存取被拒絕</h2>

          {/* Description */}
          <p className="text-base-content/70 mt-2">
            抱歉，您沒有權限訪問此頁面。
          </p>

          {/* User Info */}
          {user && (
            <div className="bg-base-200 rounded-lg p-4 w-full mt-4">
              <div className="flex items-center gap-3">
                <div className="avatar placeholder">
                  <div className="bg-neutral text-neutral-content rounded-full w-10">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} />
                    ) : (
                      <span>{user.name?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                </div>
                <div className="text-left">
                  <div className="font-semibold">{user.name}</div>
                  <div className="text-sm text-base-content/60">{user.email}</div>
                </div>
              </div>
              {user.roles && user.roles.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {user.roles.map((role) => (
                    <span key={role.id} className="badge badge-outline badge-sm">
                      {role.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Missing Permissions */}
          {missingPermissions.length > 0 && (
            <div className="alert alert-warning mt-4">
              <span className="iconify lucide--alert-triangle size-5" />
              <div className="text-left">
                <div className="font-semibold">缺少以下權限：</div>
                <ul className="list-disc list-inside text-sm mt-1">
                  {missingPermissions.map((perm) => (
                    <li key={perm}>{perm}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="card-actions justify-center mt-6 gap-2">
            <button onClick={() => navigate(-1)} className="btn btn-outline">
              <span className="iconify lucide--arrow-left size-5" />
              返回上頁
            </button>
            <Link to="/dashboard" className="btn btn-primary">
              <span className="iconify lucide--home size-5" />
              返回儀表板
            </Link>
          </div>

          {/* Help */}
          <div className="divider" />
          <p className="text-sm text-base-content/60">
            如需更多權限，請聯繫系統管理員
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
