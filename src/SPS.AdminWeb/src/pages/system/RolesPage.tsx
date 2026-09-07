import { useState, useEffect } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { adminRolesApi } from '@/lib/api/admin-roles';
import type { RoleDto, PermissionDto, CreateRoleRequest, UpdateRoleRequest } from '@/types/admin-role';
import { permissionBitmaskToArray, permissionArrayToBitmask } from '@/types/admin-role';
import { useConfirm } from '@/hooks/useConfirm';
import { useNotify } from '@/hooks/useNotify';

interface RoleFormData {
  name: string;
  description: string;
  selectedPermissions: bigint[]; // 使用 BigInt 處理 64-bit 權限值
}

export const RolesPage = () => {
  const notify = useNotify();
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<PermissionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDto | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { confirmDialog, ConfirmComponent } = useConfirm();

  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    selectedPermissions: [],
  });

  useEffect(() => {
    void fetchRoles();
    void fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const roleList = await adminRolesApi.getList();
      setRoles(roleList);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const permissions = await adminRolesApi.getPermissions();
      setAvailablePermissions(permissions);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

  // 計算權限數量 (使用 BigInt)
  const countPermissions = (bitmask: number): number => {
    return permissionBitmaskToArray(bitmask, availablePermissions).length;
  };

  const handleOpenModal = (role?: RoleDto) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description || '',
        selectedPermissions: permissionBitmaskToArray(role.permissions, availablePermissions),
      });
    } else {
      setEditingRole(null);
      setFormData({ name: '', description: '', selectedPermissions: [] });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
    setFormData({ name: '', description: '', selectedPermissions: [] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      await notify.warning('請輸入角色名稱');
      return;
    }

    setIsSaving(true);
    try {
      // 使用 BigInt 計算位掩碼，然後轉為字串傳送
      const permissionsBitmask = permissionArrayToBitmask(formData.selectedPermissions);
      const permissionsStr = permissionsBitmask.toString();

      if (editingRole) {
        const request: UpdateRoleRequest = {
          name: formData.name,
          description: formData.description,
          permissions: permissionsStr,
        };
        await adminRolesApi.update(editingRole.id, request);
        await notify.success('角色更新成功');
      } else {
        const request: CreateRoleRequest = {
          name: formData.name,
          description: formData.description,
          permissions: permissionsStr,
        };
        await adminRolesApi.create(request);
        await notify.success('角色創建成功');
      }
      handleCloseModal();
      await fetchRoles();
    } catch (error) {
      console.error('Failed to save role:', error);
      await notify.error('儲存角色失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialog({
      cardTitle: '刪除角色',
      message: '確定要刪除此角色嗎？此操作無法復原。',
      buttonConfirm: '刪除',
      confirmStyle: 'bg-error',
    });
    if (!confirmed) return;

    try {
      await adminRolesApi.delete(id);
      await notify.success('角色刪除成功');
      await fetchRoles();
    } catch (error) {
      console.error('Failed to delete role:', error);
      await notify.error('刪除角色失敗');
    }
  };

  const togglePermission = (permissionValue: number) => {
    const bigValue = BigInt(permissionValue);
    setFormData((prev) => ({
      ...prev,
      selectedPermissions: prev.selectedPermissions.some((p) => p === bigValue)
        ? prev.selectedPermissions.filter((p) => p !== bigValue)
        : [...prev.selectedPermissions, bigValue],
    }));
  };

  // 將權限按組分類
  const groupedPermissions = availablePermissions.reduce((acc, perm) => {
    if (!acc[perm.group]) {
      acc[perm.group] = [];
    }
    acc[perm.group].push(perm);
    return acc;
  }, {} as Record<string, PermissionDto[]>);

  return (
    <>
    <div className="space-y-6">
      <PageTitle
        title="角色管理"
        items={[
          { label: '系統管理', path: '/system' },
          { label: '角色管理', active: true },
        ]}
      />

      <div className="flex justify-between items-center">
        <div className="text-sm text-base-content/60">
          共 <span className="font-semibold text-base-content">{roles.length}</span> 個角色
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-success">
          <span className="iconify lucide--plus size-5" />
          新增角色
        </button>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : roles.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <span className="iconify lucide--shield size-16 mb-4" />
              <p>尚未建立任何角色</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>角色名稱</th>
                    <th>說明</th>
                    <th>權限值</th>
                    <th>建立時間</th>
                    <th>更新時間</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => {
                    const permCount = countPermissions(role.permissions);
                    return (
                      <tr key={role.id}>
                        <td>
                          <div className="font-semibold">{role.name}</div>
                        </td>
                        <td>
                          <div className="text-sm text-base-content/70 max-w-md line-clamp-2">
                            {role.description || '-'}
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-col gap-1">
                            <span className="badge badge-neutral badge-sm">
                              {permCount} 個權限
                            </span>
                            <span className="text-xs text-base-content/50">
                              值: {role.permissions}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="text-sm text-base-content/70">
                            {new Date(role.createdTime).toLocaleDateString('zh-TW')}
                          </div>
                        </td>
                        <td>
                          <div className="text-sm text-base-content/70">
                            {new Date(role.updatedTime).toLocaleDateString('zh-TW')}
                          </div>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenModal(role)}
                              className="btn btn-ghost btn-sm"
                            >
                              <span className="iconify lucide--edit size-4" />
                              編輯
                            </button>
                            <button
                              onClick={() => handleDelete(role.id)}
                              className="btn btn-ghost btn-sm text-error"
                            >
                              <span className="iconify lucide--trash-2 size-4" />
                              刪除
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 新增/編輯 Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <h3 className="font-bold text-lg mb-4">
              {editingRole ? '編輯角色' : '新增角色'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      角色名稱 <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="例如：編輯者"
                    className="input input-bordered"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">說明</span>
                  </label>
                  <textarea
                    placeholder="角色的說明..."
                    className="textarea textarea-bordered h-24"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">權限設定</span>
                    <span className="label-text-alt">
                      已選擇 {formData.selectedPermissions.length} 個權限
                    </span>
                  </label>
                  {Object.keys(groupedPermissions).length === 0 ? (
                    <div className="alert alert-warning">
                      <span className="iconify lucide--alert-triangle size-5" />
                      <span>載入權限列表中...</span>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {Object.entries(groupedPermissions).map(([group, perms]) => (
                        <div key={group} className="border border-base-300 rounded-lg p-4">
                          <h4 className="font-semibold mb-3">{group}</h4>
                          <div className="grid grid-cols-1 gap-2">
                            {perms.map((perm) => (
                              <label
                                key={perm.value}
                                className="label cursor-pointer justify-start gap-3 hover:bg-base-200 rounded p-2"
                              >
                                <input
                                  type="checkbox"
                                  className="checkbox checkbox-sm checkbox-primary"
                                  checked={formData.selectedPermissions.some((p) => p === BigInt(perm.value))}
                                  onChange={() => togglePermission(perm.value)}
                                />
                                <div className="flex-1">
                                  <div className="label-text font-medium">{perm.name}</div>
                                  {perm.description && (
                                    <div className="label-text-alt text-base-content/60">
                                      {perm.description}
                                    </div>
                                  )}
                                </div>
                                <span className="badge badge-ghost badge-xs">
                                  {perm.value}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-ghost"
                  disabled={isSaving}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-success" disabled={isSaving}>
                  {isSaving ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    <>
                      <span className="iconify lucide--save size-4" />
                      {editingRole ? '儲存' : '新增'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={handleCloseModal} />
        </div>
      )}
    </div>
    {ConfirmComponent}
      {notify.NotifyComponent}
    </>
  );
};
