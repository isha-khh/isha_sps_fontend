import React, { useState, useEffect } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { SearchBar } from '@/components/common/SearchBar';
import { adminUserApi } from '@/lib/api/admin-users';
import { adminRolesApi } from '@/lib/api/admin-roles';
import type { AdminUser, CreateAdminUserRequest } from '@/types/admin-user';
import type { RoleDto } from '@/types/admin-role';
import { useConfirm } from '@/hooks/useConfirm';
import { useNotify } from '@/hooks/useNotify';

interface AccountFormData {
  account: string;
  name: string;
  email: string;
  password: string;
  roleIds: string[];
}

export const AccountsPage = () => {
  const notify = useNotify();
  const [accounts, setAccounts] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AdminUser | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { confirmDialog, ConfirmComponent } = useConfirm();

  const [formData, setFormData] = useState<AccountFormData>({
    account: '',
    name: '',
    email: '',
    password: '',
    roleIds: [],
  });

  useEffect(() => {
    void fetchAccounts();
    void fetchRoles();
  }, [currentPage, searchTerm]);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const result = await adminUserApi.getUsers({
        search: searchTerm || undefined,
        page: currentPage,
        pageSize: 20,
      });
      setAccounts(result.items);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const roleList = await adminRolesApi.getList();
      setRoles(roleList);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const handleOpenModal = (account?: AdminUser) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        account: account.account,
        name: account.name,
        email: account.email,
        password: '',
        roleIds: account.roles.map(r => r.id),
      });
    } else {
      setEditingAccount(null);
      setFormData({
        account: '',
        name: '',
        email: '',
        password: '',
        roleIds: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
    setFormData({
      account: '',
      name: '',
      email: '',
      password: '',
      roleIds: [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.account.trim() || !formData.email.trim()) {
      await notify.warning('請輸入帳號和電子郵件');
      return;
    }

    if (!formData.password && !editingAccount) {
      await notify.warning('請輸入密碼');
      return;
    }

    if (formData.roleIds.length === 0) {
      await notify.warning('請至少選擇一個角色');
      return;
    }

    setIsSaving(true);
    try {
      if (editingAccount) {
        // 只更新權限（角色）
        await adminUserApi.updatePermissions(editingAccount.id, {
          roleIds: formData.roleIds,
        });
        await notify.success('權限更新成功');
      } else {
        // 創建新用戶
        const request: CreateAdminUserRequest = {
          account: formData.account,
          name: formData.name || formData.account,
          email: formData.email,
          password: formData.password,
          roleIds: formData.roleIds,
        };
        await adminUserApi.create(request);
        await notify.success('帳號創建成功');
      }
      handleCloseModal();
      await fetchAccounts();
    } catch (error) {
      console.error('Failed to save account:', error);
      await notify.error('儲存帳號失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (user: AdminUser) => {
    const newStatus = user.status === 1 ? 0 : 1;
    const action = newStatus === 1 ? '啟用' : '停用';

    const confirmed = await confirmDialog({
      cardTitle: `${action}帳號`,
      message: `確定要${action}此帳號嗎？`,
      buttonConfirm: action,
      confirmStyle: newStatus === 1 ? 'bg-success' : 'bg-warning',
    });
    if (!confirmed) return;

    try {
      await adminUserApi.updateStatus(user.id, { status: newStatus });
      await notify.success(`帳號${action}成功`);
      await fetchAccounts();
    } catch (error) {
      console.error('Failed to update account status:', error);
      await notify.error(`帳號${action}失敗`);
    }
  };

  return (
    <>
    <div className="space-y-6">
      <PageTitle
        title="帳號管理"
        items={[
          { label: '系統管理', path: '/system' },
          { label: '帳號管理', active: true },
        ]}
      />

      <div className="flex flex-wrap gap-4 items-center justify-between">
        <SearchBar
          placeholder="搜尋帳號、信箱或姓名..."
          value={searchTerm}
          onChange={setSearchTerm}
          onSearch={() => {
            setCurrentPage(1);
            void fetchAccounts();
          }}
        />
        <button onClick={() => handleOpenModal()} className="btn btn-success">
          <span className="iconify lucide--plus size-5" />
          新增帳號
        </button>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <span className="iconify lucide--users size-16 mb-4" />
              <p>尚未建立任何帳號</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>帳號</th>
                      <th>姓名</th>
                      <th>電子郵件</th>
                      <th>角色</th>
                      <th>狀態</th>
                      <th>最後登入</th>
                      <th>建立時間</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => (
                      <tr key={account.id}>
                        <td>
                          <div className="font-semibold">{account.account}</div>
                        </td>
                        <td>
                          <div className="text-sm">{account.name}</div>
                        </td>
                        <td>
                          <div className="text-sm text-base-content/70">{account.email}</div>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {account.roles.map((role) => (
                              <span key={role.id} className="badge badge-primary badge-sm">
                                {role.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              account.status === 1 ? 'badge-success' : 'badge-ghost'
                            }`}
                          >
                            {account.status === 1 ? '啟用' : '停用'}
                          </span>
                        </td>
                        <td>
                          <div className="text-sm text-base-content/70">
                            {account.lastLoginTime
                              ? new Date(account.lastLoginTime).toLocaleString('zh-TW')
                              : '從未登入'}
                          </div>
                        </td>
                        <td>
                          <div className="text-sm text-base-content/70">
                            {new Date(account.createdTime).toLocaleDateString('zh-TW')}
                          </div>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenModal(account)}
                              className="btn btn-ghost btn-sm"
                              title="編輯角色權限"
                            >
                              <span className="iconify lucide--edit size-4" />
                              編輯
                            </button>
                            <button
                              onClick={() => handleToggleStatus(account)}
                              className={`btn btn-ghost btn-sm ${
                                account.status === 1 ? 'text-warning' : 'text-success'
                              }`}
                              title={account.status === 1 ? '停用帳號' : '啟用帳號'}
                            >
                              <span
                                className={`iconify ${
                                  account.status === 1 ? 'lucide--user-x' : 'lucide--user-check'
                                } size-4`}
                              />
                              {account.status === 1 ? '停用' : '啟用'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 分頁控制 */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  <div className="join">
                    <button
                      className="join-item btn btn-sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      «
                    </button>
                    <button className="join-item btn btn-sm">
                      第 {currentPage} / {totalPages} 頁
                    </button>
                    <button
                      className="join-item btn btn-sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      »
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 新增/編輯 Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              {editingAccount ? '編輯帳號' : '新增帳號'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {!editingAccount && (
                  <>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">
                          帳號 <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        placeholder="帳號 (登入用)"
                        className="input input-bordered"
                        value={formData.account}
                        onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">姓名</span>
                      </label>
                      <input
                        type="text"
                        placeholder="顯示名稱"
                        className="input input-bordered"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">
                          電子郵件 <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="email"
                        placeholder="email@example.com"
                        className="input input-bordered"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">
                          密碼 <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="password"
                        placeholder="密碼"
                        className="input input-bordered"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>
                  </>
                )}

                {editingAccount && (
                  <div className="alert alert-info">
                    <span className="iconify lucide--info size-5" />
                    <span>編輯模式只能修改角色權限</span>
                  </div>
                )}

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      角色 <span className="text-error">*</span>
                    </span>
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-base-300 rounded-lg p-3">
                    {roles.map((role) => (
                      <label key={role.id} className="label cursor-pointer justify-start gap-3">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary"
                          checked={formData.roleIds.includes(role.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                roleIds: [...formData.roleIds, role.id],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                roleIds: formData.roleIds.filter((id) => id !== role.id),
                              });
                            }
                          }}
                        />
                        <span className="label-text">{role.name}</span>
                      </label>
                    ))}
                  </div>
                  {roles.length === 0 && (
                    <p className="text-sm text-error mt-1">無可用角色，請先創建角色</p>
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
                      {editingAccount ? '儲存' : '新增'}
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
