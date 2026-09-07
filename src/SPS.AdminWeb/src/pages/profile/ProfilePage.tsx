import { useState, useEffect, useCallback } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { useAuthStore } from '@/stores/auth-store';
import { FilePickerModal } from '@/components/shared/FilePickerModal';
import { adminAuthApi } from '@/lib/api/admin-auth';
import type { FileListItem, FileUploadResponse } from '@/types/files';
import type { Fido2CredentialInfo } from '@/types/fido2';
import { usePasswordPolicy } from '@/hooks/usePasswordPolicy';
import { toCreationOptions, fromAttestationResponse } from '@/lib/webauthn';

const DEFAULT_AVATAR = '/assets/avatars/1.png';

export const ProfilePage = () => {
  const { user, updateAvatar, updateProfile } = useAuthStore();

  // 表單狀態
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  // 密碼表單狀態
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI 狀態
  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 密碼策略
  const { validate: validatePassword, placeholder: passwordPlaceholder, policySummary, policy: passwordPolicy } = usePasswordPolicy();

  // FIDO2 狀態
  const [fidoCredentials, setFidoCredentials] = useState<Fido2CredentialInfo[]>([]);
  const [isFidoLoading, setIsFidoLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [fidoDeviceName, setFidoDeviceName] = useState('');
  const [fidoMessage, setFidoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchFidoCredentials = useCallback(async () => {
    setIsFidoLoading(true);
    try {
      const creds = await adminAuthApi.fido2GetCredentials();
      setFidoCredentials(creds);
    } catch {
      // ignore - feature may be disabled
    } finally {
      setIsFidoLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFidoCredentials();
  }, [fetchFidoCredentials]);

  const handleRegisterPasskey = async () => {
    setIsRegistering(true);
    setFidoMessage(null);
    try {
      // 1. Start registration
      const serverOptions = await adminAuthApi.fido2RegisterStart(fidoDeviceName || undefined);

      // 2. 轉換 base64url → ArrayBuffer，呼叫瀏覽器 WebAuthn API
      const credential = await navigator.credentials.create({
        publicKey: toCreationOptions(serverOptions),
      }) as PublicKeyCredential;

      // 3. 轉換 ArrayBuffer → base64url，送回後端完成註冊
      await adminAuthApi.fido2RegisterComplete({
        attestationResponse: fromAttestationResponse(credential),
        deviceName: fidoDeviceName || undefined,
      });

      setFidoMessage({ type: 'success', text: 'Passkey 註冊成功' });
      setFidoDeviceName('');
      await fetchFidoCredentials();
    } catch (err: any) {
      const msg = err?.name === 'NotAllowedError'
        ? '已取消或裝置不支援'
        : err?.response?.data?.error || err?.message || '註冊失敗';
      setFidoMessage({ type: 'error', text: msg });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDeleteCredential = async (id: string) => {
    if (!confirm('確定要刪除此安全金鑰？')) return;
    try {
      await adminAuthApi.fido2DeleteCredential(id);
      setFidoCredentials(prev => prev.filter(c => c.id !== id));
      setFidoMessage({ type: 'success', text: '已刪除' });
    } catch (err: any) {
      setFidoMessage({ type: 'error', text: err?.response?.data?.error || '刪除失敗' });
    }
  };

  const avatarUrl = user?.avatarUrl || DEFAULT_AVATAR;

  const handleAvatarClick = () => {
    setIsFilePickerOpen(true);
  };

  const handleFileSelect = async (file: FileListItem | FileUploadResponse) => {
    setIsUpdatingAvatar(true);
    try {
      // FileListItem 使用 id，FileUploadResponse 使用 fileId
      const fileId = 'id' in file ? file.id : file.fileId;
      await updateAvatar(fileId);
    } catch (error) {
      console.error('Failed to update avatar:', error);
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUpdatingAvatar(true);
    try {
      await updateAvatar(null);
    } catch (error) {
      console.error('Failed to remove avatar:', error);
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMessage(null);

    try {
      await updateProfile({ name, email });
      setProfileMessage({ type: 'success', text: '個人資料已更新' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '更新失敗，請稍後再試';
      setProfileMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: '新密碼與確認密碼不符' });
      return;
    }

    // 驗證密碼策略
    const policyErrors = validatePassword(newPassword);
    if (policyErrors.length > 0) {
      setPasswordMessage({ type: 'error', text: policyErrors.join('；') });
      return;
    }

    setIsChangingPassword(true);

    try {
      await adminAuthApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setPasswordMessage({ type: 'success', text: '密碼已成功修改' });
      // 清除密碼欄位
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '密碼修改失敗，請稍後再試';
      setPasswordMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageTitle title="個人資料" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側：頭像設定 */}
        <div className="lg:col-span-1">
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body items-center text-center">
              <h2 className="card-title mb-4">頭像設定</h2>

              <div className="relative">
                <div
                  className="avatar bg-base-200 isolate size-32 cursor-pointer overflow-hidden rounded-full hover:opacity-80 transition-opacity"
                  onClick={handleAvatarClick}
                >
                  {isUpdatingAvatar ? (
                    <div className="flex items-center justify-center h-full w-full">
                      <span className="loading loading-spinner loading-lg" />
                    </div>
                  ) : (
                    <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                  )}
                </div>
                <button
                  className="btn btn-circle btn-sm btn-primary absolute bottom-0 right-0"
                  onClick={handleAvatarClick}
                  disabled={isUpdatingAvatar}
                >
                  <span className="iconify lucide--pencil size-4" />
                </button>
              </div>

              <p className="text-lg font-medium mt-4">{user?.name}</p>
              <p className="text-base-content/60 text-sm">{user?.account}</p>

              <div className="flex gap-2 mt-4">
                <button
                  className="btn btn-sm btn-outline"
                  onClick={handleAvatarClick}
                  disabled={isUpdatingAvatar}
                >
                  <span className="iconify lucide--upload size-4" />
                  更換頭像
                </button>
                {user?.avatarFileId && (
                  <button
                    className="btn btn-sm btn-outline btn-error"
                    onClick={handleRemoveAvatar}
                    disabled={isUpdatingAvatar}
                  >
                    <span className="iconify lucide--trash-2 size-4" />
                    移除
                  </button>
                )}
              </div>

              <div className="divider" />

              <div className="w-full text-left space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="iconify lucide--shield-check size-4 text-success" />
                  <span>角色：{user?.roles?.map(r => r.name).join(', ') || '無'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="iconify lucide--mail size-4 text-info" />
                  <span>{user?.email || '未設定郵箱'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右側：表單區域 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本資料 */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">
                <span className="iconify lucide--user size-5" />
                基本資料
              </h2>

              {profileMessage && (
                <div className={`alert ${profileMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                  <span className={`iconify ${profileMessage.type === 'success' ? 'lucide--check-circle' : 'lucide--alert-circle'} size-5`} />
                  <span>{profileMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">帳號</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={user?.account || ''}
                    disabled
                  />
                  <label className="label">
                    <span className="label-text-alt text-base-content/50">帳號無法修改</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">顯示名稱</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="請輸入顯示名稱"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">電子郵件</span>
                  </label>
                  <input
                    type="email"
                    className="input input-bordered"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="請輸入電子郵件"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isUpdatingProfile}
                  >
                    {isUpdatingProfile ? (
                      <>
                        <span className="loading loading-spinner loading-sm" />
                        儲存中...
                      </>
                    ) : (
                      <>
                        <span className="iconify lucide--save size-4" />
                        儲存變更
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* 修改密碼 */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">
                <span className="iconify lucide--lock size-5" />
                修改密碼
              </h2>

              {passwordMessage && (
                <div className={`alert ${passwordMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                  <span className={`iconify ${passwordMessage.type === 'success' ? 'lucide--check-circle' : 'lucide--alert-circle'} size-5`} />
                  <span>{passwordMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">目前密碼</span>
                  </label>
                  <input
                    type="password"
                    className="input input-bordered"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="請輸入目前密碼"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">新密碼</span>
                  </label>
                  <input
                    type="password"
                    className="input input-bordered"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={passwordPlaceholder}
                    minLength={passwordPolicy.minLength}
                    required
                  />
                  <label className="label">
                    <span className="label-text-alt text-base-content/50">{policySummary}</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">確認新密碼</span>
                  </label>
                  <input
                    type="password"
                    className="input input-bordered"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="請再次輸入新密碼"
                    minLength={passwordPolicy.minLength}
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="btn btn-warning"
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? (
                      <>
                        <span className="loading loading-spinner loading-sm" />
                        變更中...
                      </>
                    ) : (
                      <>
                        <span className="iconify lucide--key size-4" />
                        變更密碼
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
          {/* Passkey / 安全金鑰管理 */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">
                <span className="iconify lucide--fingerprint size-5" />
                Passkey 管理
              </h2>
              <p className="text-sm text-base-content/60">
                註冊 Passkey 後可免密碼登入後台
              </p>

              {fidoMessage && (
                <div className={`alert ${fidoMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                  <span className={`iconify ${fidoMessage.type === 'success' ? 'lucide--check-circle' : 'lucide--alert-circle'} size-5`} />
                  <span>{fidoMessage.text}</span>
                </div>
              )}

              {/* 已註冊的憑證 */}
              {isFidoLoading ? (
                <div className="flex justify-center py-4">
                  <span className="loading loading-spinner" />
                </div>
              ) : fidoCredentials.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>裝置名稱</th>
                        <th>建立時間</th>
                        <th>最後使用</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {fidoCredentials.map((cred) => (
                        <tr key={cred.id}>
                          <td>{cred.deviceName || '未命名裝置'}</td>
                          <td className="text-sm text-base-content/60">
                            {new Date(cred.createdTime).toLocaleDateString()}
                          </td>
                          <td className="text-sm text-base-content/60">
                            {cred.lastUsedAt ? new Date(cred.lastUsedAt).toLocaleDateString() : '從未'}
                          </td>
                          <td>
                            <button
                              className="btn btn-ghost btn-xs btn-error"
                              onClick={() => handleDeleteCredential(cred.id)}
                            >
                              <span className="iconify lucide--trash-2 size-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4 text-base-content/50 text-sm">
                  尚未註冊任何 Passkey
                </div>
              )}

              <div className="divider" />

              {/* 註冊新 Passkey */}
              <div className="flex items-end gap-3">
                <div className="form-control flex-1">
                  <label className="label">
                    <span className="label-text">裝置名稱（選填）</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm"
                    placeholder="例如：MacBook 指紋、YubiKey"
                    value={fidoDeviceName}
                    onChange={(e) => setFidoDeviceName(e.target.value)}
                  />
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleRegisterPasskey}
                  disabled={isRegistering}
                >
                  {isRegistering ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <span className="iconify lucide--plus size-4" />
                  )}
                  註冊 Passkey
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 檔案選擇器 Modal */}
      <FilePickerModal
        isOpen={isFilePickerOpen}
        onClose={() => setIsFilePickerOpen(false)}
        onSelect={handleFileSelect}
        fileType="image"
        title="選擇頭像圖片"
      />
    </div>
  );
};
