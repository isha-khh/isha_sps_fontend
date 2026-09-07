import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { MemberStatusBadge } from '@/components/members/MemberStatusBadge';
import { membersApi } from '@/lib/api/members';
import type { Member, MemberStatus, MemberRole, MemberPosition, UpdateMemberRequest } from '@/types/member';
import { useNotify } from '@/hooks/useNotify';

const MemberRoleLabels: Record<MemberRole, string> = {
  1: '供給端',
  2: '需求端',
};

const MemberPositionLabels: Record<MemberPosition, string> = {
  1: '經理',
  2: '員工',
};

const StatusOptions: { value: MemberStatus; label: string }[] = [
  { value: 0, label: '停用' },
  { value: 1, label: '啟用' },
  { value: 2, label: '暫停' },
  { value: 3, label: '鎖定' },
  { value: 4, label: '待審核' },
  { value: 5, label: '已審核' },
  { value: 6, label: '已拒絕' },
];

export const MemberDetailPage = () => {
  const notify = useNotify();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');

  // 編輯模式
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<UpdateMemberRequest>({});

  // 密碼重置
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordForm, setResetPasswordForm] = useState({
    newPassword: '',
    requireChangeOnLogin: true,
    sendNotificationEmail: true,
  });
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // 解鎖帳戶
  const [isUnlocking, setIsUnlocking] = useState(false);

  // 信箱驗證
  const [isUpdatingEmailVerification, setIsUpdatingEmailVerification] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchMember();
  }, [id]);

  const fetchMember = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await membersApi.getMemberById(id);
      setMember(data);
      setEditForm({
        name: data.name,
        phone: data.phone || '',
        extension: data.extension || '',
        mobilePhone: data.mobilePhone || '',
        status: data.status,
        remark: data.remark || '',
        memberJobTitle: data.memberJobTitle || '',
        position: data.position || '',
        requirePasswordChange: !data.firstChanged,
      });
    } catch (error) {
      console.error('Failed to fetch member:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id || !member) return;
    setIsSaving(true);
    try {
      const updated = await membersApi.updateMember(id, editForm);
      setMember(updated);
      setIsEditing(false);
      await notify.success('會員資料已更新');
    } catch (error) {
      console.error('Failed to update member:', error);
      await notify.error('更新失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!id) return;
    setIsResettingPassword(true);
    try {
      await membersApi.resetMemberPassword(id, {
        newPassword: resetPasswordForm.newPassword || undefined,
        requireChangeOnLogin: resetPasswordForm.requireChangeOnLogin,
        sendNotificationEmail: resetPasswordForm.sendNotificationEmail,
      });
      setShowResetPasswordModal(false);
      setResetPasswordForm({
        newPassword: '',
        requireChangeOnLogin: true,
        sendNotificationEmail: true,
      });
      await notify.success('密碼已重置');
      fetchMember();
    } catch (error) {
      console.error('Failed to reset password:', error);
      await notify.error('重置密碼失敗');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleUnlock = async () => {
    if (!id) return;
    setIsUnlocking(true);
    try {
      await membersApi.unlockMember(id);
      await notify.success('帳戶已解鎖');
      fetchMember();
    } catch (error) {
      console.error('Failed to unlock member:', error);
      await notify.error('解鎖失敗');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleUpdateEmailVerification = async (isVerified: boolean) => {
    if (!id) return;
    setIsUpdatingEmailVerification(true);
    try {
      await membersApi.updateEmailVerification(id, isVerified);
      await notify.success(isVerified ? '已設為信箱已驗證' : '已設為信箱未驗證');
      fetchMember();
    } catch (error) {
      console.error('Failed to update email verification:', error);
      await notify.error('更新失敗');
    } finally {
      setIsUpdatingEmailVerification(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-TW');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        {notify.NotifyComponent}
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <span className="iconify lucide--user-x size-16 mb-4 text-base-content/40" />
        <p className="text-lg text-base-content/60">會員不存在</p>
        <button onClick={() => navigate('/members')} className="btn btn-primary mt-4">
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="會員詳情"
        items={[
          { label: '會員管理', path: '/members' },
          { label: '詳情', active: true },
        ]}
      />

      <div className="flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="btn btn-ghost">
          <span className="iconify lucide--arrow-left size-4" />
          返回
        </button>
        <div className="flex gap-2">
          {member.lockedTime && new Date(member.lockedTime) > new Date() && (
            <button
              onClick={handleUnlock}
              disabled={isUnlocking}
              className="btn btn-warning"
            >
              {isUnlocking ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <span className="iconify lucide--unlock size-4" />
              )}
              解鎖帳戶
            </button>
          )}
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="btn btn-primary">
              <span className="iconify lucide--edit size-4" />
              編輯資料
            </button>
          ) : (
            <>
              <button onClick={() => setIsEditing(false)} className="btn btn-ghost">
                取消
              </button>
              <button onClick={handleSave} disabled={isSaving} className="btn btn-success">
                {isSaving ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <span className="iconify lucide--save size-4" />
                )}
                儲存
              </button>
            </>
          )}
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {/* 會員頭像和基本信息 */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="avatar placeholder">
                <div className="bg-primary text-primary-content rounded-full w-20">
                  <span className="text-3xl">{member.name.charAt(0)}</span>
                </div>
              </div>
              <div>
                <h2 className="card-title text-2xl">{member.name}</h2>
                <p className="text-base-content/70">{member.email}</p>
                {member.number && (
                  <p className="text-sm text-base-content/60">會員編號: {member.number}</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <MemberStatusBadge status={member.status} />
              <span className="badge badge-outline">
                {MemberRoleLabels[member.role]}
              </span>
              <span className="badge badge-outline">
                {MemberPositionLabels[member.memberPosition]}
              </span>
              {member.isApproved && (
                <span className="badge badge-success">已審核</span>
              )}
            </div>
          </div>

          {/* Tab 切換 */}
          <div role="tablist" className="tabs tabs-lifted tabs-lg mb-6">
            <a
              role="tab"
              className={`tab ${activeTab === 'info' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              基本資料
            </a>
            <a
              role="tab"
              className={`tab ${activeTab === 'password' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('password')}
            >
              密碼管理
            </a>
          </div>

          {activeTab === 'info' ? (
            <div className="grid gap-6">
              {/* 基本資訊 */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="iconify lucide--user size-5" />
                  基本資訊
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">會員 ID</span>
                    </label>
                    <p className="text-base-content font-mono text-sm">{member.id}</p>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">姓名</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="input input-bordered"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    ) : (
                      <p className="text-base-content">{member.name}</p>
                    )}
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">電子郵件</span>
                    </label>
                    <p className="text-base-content">{member.email}</p>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">手機號碼</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="input input-bordered"
                        value={editForm.mobilePhone || ''}
                        onChange={(e) => setEditForm({ ...editForm, mobilePhone: e.target.value })}
                      />
                    ) : (
                      <p className="text-base-content">{member.mobilePhone || '-'}</p>
                    )}
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">市話</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="input input-bordered"
                        value={editForm.phone || ''}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                    ) : (
                      <p className="text-base-content">{member.phone || '-'}</p>
                    )}
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">分機</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="input input-bordered"
                        value={editForm.extension || ''}
                        onChange={(e) => setEditForm({ ...editForm, extension: e.target.value })}
                      />
                    ) : (
                      <p className="text-base-content">{member.extension || '-'}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="divider" />

              {/* 職務資訊 */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="iconify lucide--briefcase size-5" />
                  職務資訊
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">職稱</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="input input-bordered"
                        value={editForm.memberJobTitle || ''}
                        onChange={(e) => setEditForm({ ...editForm, memberJobTitle: e.target.value })}
                      />
                    ) : (
                      <p className="text-base-content">{member.memberJobTitle || '-'}</p>
                    )}
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">職位</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="input input-bordered"
                        value={editForm.position || ''}
                        onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                      />
                    ) : (
                      <p className="text-base-content">{member.position || '-'}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="divider" />

              {/* 公司資訊 */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="iconify lucide--building-2 size-5" />
                  公司資訊
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">公司名稱</span>
                    </label>
                    {member.companyId ? (
                      <a
                        href={`/companies/${member.companyId}`}
                        className="link link-primary"
                      >
                        {member.companyName}
                      </a>
                    ) : (
                      <p className="text-base-content/60">尚未綁定公司</p>
                    )}
                  </div>
                  {member.companyId && (
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">會員角色</span>
                      </label>
                      <p className="text-base-content">
                        {MemberRoleLabels[member.role]} - {MemberPositionLabels[member.memberPosition]}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="divider" />

              {/* 帳號狀態 */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="iconify lucide--activity size-5" />
                  帳號狀態
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">帳號狀態</span>
                    </label>
                    {isEditing ? (
                      <select
                        className="select select-bordered"
                        value={editForm.status}
                        onChange={(e) =>
                          setEditForm({ ...editForm, status: Number(e.target.value) as MemberStatus })
                        }
                      >
                        {StatusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div>
                        <MemberStatusBadge status={member.status} />
                      </div>
                    )}
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">審核狀態</span>
                    </label>
                    <div>
                      {member.isApproved ? (
                        <span className="badge badge-success">已審核通過</span>
                      ) : (
                        <span className="badge badge-warning">待審核</span>
                      )}
                    </div>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">信箱驗證狀態</span>
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {member.isEmailVerified ? (
                        <>
                          <span className="badge badge-success gap-1">
                            <span className="iconify lucide--mail-check size-3" />
                            已驗證
                          </span>
                          {member.emailVerifiedAt && (
                            <span className="text-xs text-base-content/60">
                              {formatDate(member.emailVerifiedAt)}
                            </span>
                          )}
                          <button
                            onClick={() => handleUpdateEmailVerification(false)}
                            disabled={isUpdatingEmailVerification}
                            className="btn btn-outline btn-error btn-xs"
                          >
                            {isUpdatingEmailVerification ? (
                              <span className="loading loading-spinner loading-xs" />
                            ) : (
                              <span className="iconify lucide--x size-4" />
                            )}
                            設為未驗證
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="badge badge-error gap-1">
                            <span className="iconify lucide--mail-x size-3" />
                            未驗證
                          </span>
                          <button
                            onClick={() => handleUpdateEmailVerification(true)}
                            disabled={isUpdatingEmailVerification}
                            className="btn btn-outline btn-success btn-xs"
                          >
                            {isUpdatingEmailVerification ? (
                              <span className="loading loading-spinner loading-xs" />
                            ) : (
                              <span className="iconify lucide--check size-4" />
                            )}
                            設為已驗證
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">最後登入時間</span>
                    </label>
                    <p className="text-base-content">{formatDate(member.lastLoginAt)}</p>
                  </div>
                </div>
              </div>

              <div className="divider" />

              {/* 備註 */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="iconify lucide--sticky-note size-5" />
                  備註
                </h3>
                <div className="form-control">
                  {isEditing ? (
                    <textarea
                      className="textarea textarea-bordered h-24"
                      value={editForm.remark || ''}
                      onChange={(e) => setEditForm({ ...editForm, remark: e.target.value })}
                      placeholder="輸入備註..."
                    />
                  ) : (
                    <p className="text-base-content whitespace-pre-wrap">
                      {member.remark || '無備註'}
                    </p>
                  )}
                </div>
              </div>

              <div className="divider" />

              {/* 時間記錄 */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="iconify lucide--clock size-5" />
                  時間記錄
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">註冊時間</span>
                    </label>
                    <p className="text-sm text-base-content/70">{formatDate(member.createdAt)}</p>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">最後更新</span>
                    </label>
                    <p className="text-sm text-base-content/70">{formatDate(member.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-6">
              {/* 密碼狀態 */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="iconify lucide--key size-5" />
                  密碼狀態
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">首次登入密碼修改</span>
                    </label>
                    <div>
                      {member.firstChanged ? (
                        <span className="badge badge-success">已完成</span>
                      ) : (
                        <span className="badge badge-warning">需要修改</span>
                      )}
                    </div>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">密碼是否修改過</span>
                    </label>
                    <div>
                      {member.passwordChanged ? (
                        <span className="badge badge-info">已修改過</span>
                      ) : (
                        <span className="badge badge-ghost">使用初始密碼</span>
                      )}
                    </div>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">密碼最後修改時間</span>
                    </label>
                    <p className="text-base-content">{formatDate(member.passwordChangedTime)}</p>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">登入失敗次數</span>
                    </label>
                    <p className="text-base-content">{member.loginFailure} 次</p>
                  </div>
                </div>
              </div>

              <div className="divider" />

              {/* 帳戶鎖定狀態 */}
              {member.lockedTime && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span className="iconify lucide--lock size-5" />
                      帳戶鎖定狀態
                    </h3>
                    <div className="alert alert-warning">
                      <span className="iconify lucide--alert-triangle size-5" />
                      <div>
                        <p className="font-semibold">帳戶已被鎖定</p>
                        <p className="text-sm">
                          鎖定時間: {formatDate(member.lockedTime)}
                        </p>
                        {new Date(member.lockedTime) > new Date() && (
                          <p className="text-sm">帳戶仍在鎖定中</p>
                        )}
                      </div>
                      {new Date(member.lockedTime) > new Date() && (
                        <button
                          onClick={handleUnlock}
                          disabled={isUnlocking}
                          className="btn btn-sm btn-warning"
                        >
                          {isUnlocking ? (
                            <span className="loading loading-spinner loading-sm" />
                          ) : (
                            '解鎖'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="divider" />
                </>
              )}

              {/* 密碼設定 */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="iconify lucide--settings size-5" />
                  密碼設定
                </h3>

                {/* 要求下次登入修改密碼 */}
                <div className="form-control mb-4">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className="toggle toggle-warning"
                      checked={editForm.requirePasswordChange}
                      onChange={(e) =>
                        setEditForm({ ...editForm, requirePasswordChange: e.target.checked })
                      }
                    />
                    <div>
                      <span className="label-text font-medium">要求下次登入修改密碼</span>
                      <p className="text-sm text-base-content/60">
                        啟用後，會員下次登入時必須修改密碼才能繼續使用
                      </p>
                    </div>
                  </label>
                  {editForm.requirePasswordChange !== !member.firstChanged && (
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="btn btn-sm btn-primary mt-2 w-fit"
                    >
                      {isSaving ? (
                        <span className="loading loading-spinner loading-sm" />
                      ) : (
                        '儲存變更'
                      )}
                    </button>
                  )}
                </div>

                <div className="divider" />

                {/* 重置密碼按鈕 */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">重置密碼</span>
                  </label>
                  <p className="text-sm text-base-content/60 mb-2">
                    重置會員密碼，可以設定新密碼或自動生成隨機密碼
                  </p>
                  <button
                    onClick={() => setShowResetPasswordModal(true)}
                    className="btn btn-warning w-fit"
                  >
                    <span className="iconify lucide--key-round size-4" />
                    重置密碼
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 重置密碼 Modal */}
      {showResetPasswordModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">重置會員密碼</h3>
            <p className="py-2 text-base-content/60">
              重置使用者 「{member.name}」 的密碼
            </p>

            <div className="space-y-4 mt-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">新密碼（留空則自動生成）</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={resetPasswordForm.newPassword}
                  onChange={(e) =>
                    setResetPasswordForm({ ...resetPasswordForm, newPassword: e.target.value })
                  }
                  placeholder="輸入新密碼或留空自動生成"
                />
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={resetPasswordForm.requireChangeOnLogin}
                    onChange={(e) =>
                      setResetPasswordForm({
                        ...resetPasswordForm,
                        requireChangeOnLogin: e.target.checked,
                      })
                    }
                  />
                  <span className="label-text">要求下次登入時修改密碼</span>
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={resetPasswordForm.sendNotificationEmail}
                    onChange={(e) =>
                      setResetPasswordForm({
                        ...resetPasswordForm,
                        sendNotificationEmail: e.target.checked,
                      })
                    }
                  />
                  <span className="label-text">發送通知郵件給會員</span>
                </label>
              </div>
            </div>

            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setShowResetPasswordModal(false)}
              >
                取消
              </button>
              <button
                className="btn btn-warning"
                onClick={handleResetPassword}
                disabled={isResettingPassword}
              >
                {isResettingPassword ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <>
                    <span className="iconify lucide--key-round size-4" />
                    確認重置
                  </>
                )}
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => setShowResetPasswordModal(false)}
          />
        </div>
      )}
    </div>
  );
};
