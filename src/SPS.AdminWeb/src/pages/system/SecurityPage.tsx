import { useState, useEffect } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { TabSelector } from '@/components/common/TabSelector';
import { settingsApi } from '@/lib/api/system-settings';
import { adminAuthApi } from '@/lib/api/admin-auth';
import { captchaApi } from '@/lib/api/captcha';
import * as httpSecurityApi from '@/lib/api/http-security';
import type { SecuritySettings, PasswordPolicySettings } from '@/types/settings';
import type { ChangePasswordRequest } from '@/types/admin-auth';
import type { CaptchaSettings } from '@/types/captcha';
import { CaptchaType } from '@/types/captcha';
import type { HttpSecuritySettings, SecurityTemplateName } from '@/types/http-security';
import { securityTemplates, defaultHttpSecuritySettings } from '@/types/http-security';
import { systemInfoApi } from '@/lib/api/system-info';
import type { Fido2Info } from '@/types/fido2';
import type { Fido2Settings } from '@/types/settings';
import { useNotify } from '@/hooks/useNotify';

type TabType = 'security' | 'password-policy' | 'captcha' | 'http-security' | 'fido2' | 'change-password';

const tabs = [
  { value: 'security' as TabType, label: '登入保護', icon: 'lucide--shield' },
  { value: 'password-policy' as TabType, label: '密碼策略', icon: 'lucide--key' },
  { value: 'captcha' as TabType, label: '驗證碼設定', icon: 'lucide--image' },
  { value: 'http-security' as TabType, label: 'HTTP 安全性', icon: 'lucide--globe' },
  { value: 'fido2' as TabType, label: 'FIDO2 / Passkey', icon: 'lucide--fingerprint' },
  { value: 'change-password' as TabType, label: '修改密碼', icon: 'lucide--lock' },
];

export const SecurityPage = () => {
  const notify = useNotify();
  const [activeTab, setActiveTab] = useState<TabType>('security');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    enableLoginLockout: false,
    maxFailedAttempts: 5,
    lockoutDurationMinutes: 30,
    requirePasswordChangeOnFirstLogin: false,
    enablePasswordExpiry: false,
    passwordExpiryDays: 90,
  });

  // Password Policy Settings
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicySettings>({
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireDigit: true,
    requireSpecialCharacter: false,
    passwordHistoryCount: 0,
  });

  // Change Password
  const [passwordForm, setPasswordForm] = useState<ChangePasswordRequest>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // CAPTCHA Settings
  const [captchaSettings, setCaptchaSettings] = useState<CaptchaSettings>({
    enabled: false,
    captchaType: CaptchaType.None,
    scenarios: {
      memberLogin: false,
      memberRegister: false,
      adminLogin: false,
      forgotPassword: false,
    },
    turnstile: {
      siteKey: '',
      secretKey: '',
    },
    imageCaptcha: {
      codeLength: 4,
      expirationSeconds: 120,
      maxAttempts: 5,
      enableAudio: true,
    },
  });

  // FIDO2 Settings
  const [fido2Info, setFido2Info] = useState<Fido2Info | null>(null);
  const [fido2Settings, setFido2Settings] = useState<Fido2Settings>({
    enableForMember: false,
    enableForAdmin: false,
  });

  // HTTP Security Settings
  const [httpSecuritySettings, setHttpSecuritySettings] = useState<HttpSecuritySettings>(defaultHttpSecuritySettings);
  const [httpSecuritySubTab, setHttpSecuritySubTab] = useState<'template' | 'cookie' | 'headers' | 'csp' | 'cors'>('template');
  const [nginxConfigPreview, setNginxConfigPreview] = useState<string>('');
  const [newOriginInput, setNewOriginInput] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const [security, policy, captcha, httpSecurity, sysInfo, fido2] = await Promise.all([
        settingsApi.getSecuritySettings(),
        settingsApi.getPasswordPolicySettings(),
        captchaApi.getSettings(),
        httpSecurityApi.getHttpSecuritySettings().catch(() => defaultHttpSecuritySettings),
        systemInfoApi.getSystemInfo().catch(() => null),
        settingsApi.getFido2Settings().catch((): Fido2Settings => ({ enableForMember: false, enableForAdmin: false })),
      ]);
      setSecuritySettings(security);
      setPasswordPolicy(policy);
      setCaptchaSettings(captcha);
      setHttpSecuritySettings(httpSecurity);
      if (sysInfo?.fido2) setFido2Info(sysInfo.fido2);
      // 合併：DB 設定優先，sysInfo 提供有效值（含 env var fallback）
      const fido2Data = fido2 ?? { enableForMember: false, enableForAdmin: false };
      setFido2Settings({
        ...fido2Data,
        serverDomain: fido2Data.serverDomain || sysInfo?.fido2?.serverDomain || '',
        serverName: fido2Data.serverName || sysInfo?.fido2?.serverName || '',
        origins: fido2Data.origins?.length ? fido2Data.origins : sysInfo?.fido2?.origins || [],
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSecuritySettings = async () => {
    setIsSaving(true);
    try {
      await settingsApi.updateSecuritySettings(securitySettings);
      await notify.success('安全設定已儲存');
    } catch (error) {
      console.error('Failed to save security settings:', error);
      await notify.error('儲存安全設定失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePasswordPolicy = async () => {
    setIsSaving(true);
    try {
      await settingsApi.updatePasswordPolicySettings(passwordPolicy);
      await notify.success('密碼策略已儲存');
    } catch (error) {
      console.error('Failed to save password policy:', error);
      await notify.error('儲存密碼策略失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCaptchaSettings = async () => {
    setIsSaving(true);
    try {
      await captchaApi.updateSettings(captchaSettings);
      await notify.success('驗證碼設定已儲存');
    } catch (error) {
      console.error('Failed to save captcha settings:', error);
      await notify.error('儲存驗證碼設定失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      await notify.warning('新密碼與確認密碼不一致');
      return;
    }

    if (passwordForm.newPassword.length < passwordPolicy.minLength) {
      await notify.warning(`密碼長度至少需要 ${passwordPolicy.minLength} 個字元`);
      return;
    }

    setIsSaving(true);
    try {
      await adminAuthApi.changePassword(passwordForm);
      await notify.success('密碼修改成功');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Failed to change password:', error);
      await notify.error('密碼修改失敗，請確認目前密碼是否正確');
    } finally {
      setIsSaving(false);
    }
  };

  // HTTP Security handlers
  const handleApplyTemplate = async (templateName: SecurityTemplateName) => {
    setIsSaving(true);
    try {
      const result = await httpSecurityApi.applySecurityTemplate(templateName);
      setHttpSecuritySettings(result.settings);
      await notify.success(`已套用「${securityTemplates.find(t => t.name === templateName)?.label}」模板`);
    } catch (error) {
      console.error('Failed to apply template:', error);
      await notify.error('套用模板失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveHttpSecuritySettings = async () => {
    setIsSaving(true);
    try {
      await httpSecurityApi.updateHttpSecuritySettings(httpSecuritySettings);
      await notify.success('HTTP 安全性設定已儲存');
    } catch (error) {
      console.error('Failed to save HTTP security settings:', error);
      await notify.error('儲存 HTTP 安全性設定失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const [isReloading, setIsReloading] = useState(false);

  const handleReloadNginx = async () => {
    setIsReloading(true);
    try {
      const result = await httpSecurityApi.reloadNginxConfig();
      await notify.info(result.message);
    } catch (error) {
      console.error('Failed to reload nginx:', error);
      await notify.error('重新載入 Nginx 設定失敗');
    } finally {
      setIsReloading(false);
    }
  };

  const handleExportNginxConfig = async () => {
    try {
      const result = await httpSecurityApi.exportNginxConfig();
      setNginxConfigPreview(result.configContent);
    } catch (error) {
      console.error('Failed to export nginx config:', error);
      await notify.error('匯出 Nginx 設定失敗');
    }
  };

  const handleDownloadNginxConfig = async () => {
    try {
      await httpSecurityApi.downloadNginxConfig();
    } catch (error) {
      console.error('Failed to download nginx config:', error);
      await notify.error('下載 Nginx 設定失敗');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        {notify.NotifyComponent}
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="安全設置"
        items={[
          { label: '系統管理', path: '/system' },
          { label: '安全設置', active: true },
        ]}
      />

      <TabSelector
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 登入保護 Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h3 className="card-title">登入失敗鎖定</h3>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-success"
                    checked={securitySettings.enableLoginLockout}
                    onChange={(e) =>
                      setSecuritySettings({ ...securitySettings, enableLoginLockout: e.target.checked })
                    }
                  />
                  <div>
                    <span className="label-text font-medium">啟用登入失敗鎖定</span>
                    <p className="text-sm text-base-content/60">
                      當登入失敗達到指定次數後，暫時鎖定帳戶
                    </p>
                  </div>
                </label>
              </div>

              {securitySettings.enableLoginLockout && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pl-14">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">最大登入嘗試次數</span>
                    </label>
                    <input
                      type="number"
                      min="3"
                      max="10"
                      className="input input-bordered"
                      value={securitySettings.maxFailedAttempts}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          maxFailedAttempts: parseInt(e.target.value) || 5,
                        })
                      }
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">鎖定時長 (分鐘)</span>
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="120"
                      className="input input-bordered"
                      value={securitySettings.lockoutDurationMinutes}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          lockoutDurationMinutes: parseInt(e.target.value) || 30,
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h3 className="card-title">密碼安全政策</h3>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-success"
                    checked={securitySettings.requirePasswordChangeOnFirstLogin}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        requirePasswordChangeOnFirstLogin: e.target.checked,
                      })
                    }
                  />
                  <div>
                    <span className="label-text font-medium">首次登入強制修改密碼</span>
                    <p className="text-sm text-base-content/60">
                      使用者首次登入時必須修改密碼
                    </p>
                  </div>
                </label>
              </div>

              <div className="divider" />

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-success"
                    checked={securitySettings.enablePasswordExpiry}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        enablePasswordExpiry: e.target.checked,
                      })
                    }
                  />
                  <div>
                    <span className="label-text font-medium">啟用密碼過期</span>
                    <p className="text-sm text-base-content/60">
                      密碼在一定期間後必須重新設定
                    </p>
                  </div>
                </label>
              </div>

              {securitySettings.enablePasswordExpiry && (
                <div className="form-control mt-4 pl-14">
                  <label className="label">
                    <span className="label-text font-medium">密碼有效天數</span>
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="365"
                    className="input input-bordered w-48"
                    value={securitySettings.passwordExpiryDays}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        passwordExpiryDays: parseInt(e.target.value) || 90,
                      })
                    }
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="btn btn-success"
              onClick={handleSaveSecuritySettings}
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  <span className="iconify lucide--save size-5" />
                  儲存設定
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 密碼策略 Tab */}
      {activeTab === 'password-policy' && (
        <div className="space-y-6">
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h3 className="card-title">密碼複雜度要求</h3>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">密碼最小長度</span>
                </label>
                <input
                  type="number"
                  min="6"
                  max="32"
                  className="input input-bordered w-32"
                  value={passwordPolicy.minLength}
                  onChange={(e) =>
                    setPasswordPolicy({
                      ...passwordPolicy,
                      minLength: parseInt(e.target.value) || 8,
                    })
                  }
                />
              </div>

              <div className="divider" />

              <div className="space-y-3">
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className="toggle toggle-success"
                      checked={passwordPolicy.requireUppercase}
                      onChange={(e) =>
                        setPasswordPolicy({
                          ...passwordPolicy,
                          requireUppercase: e.target.checked,
                        })
                      }
                    />
                    <span className="label-text">要求包含大寫字母 (A-Z)</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className="toggle toggle-success"
                      checked={passwordPolicy.requireLowercase}
                      onChange={(e) =>
                        setPasswordPolicy({
                          ...passwordPolicy,
                          requireLowercase: e.target.checked,
                        })
                      }
                    />
                    <span className="label-text">要求包含小寫字母 (a-z)</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className="toggle toggle-success"
                      checked={passwordPolicy.requireDigit}
                      onChange={(e) =>
                        setPasswordPolicy({
                          ...passwordPolicy,
                          requireDigit: e.target.checked,
                        })
                      }
                    />
                    <span className="label-text">要求包含數字 (0-9)</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className="toggle toggle-success"
                      checked={passwordPolicy.requireSpecialCharacter}
                      onChange={(e) =>
                        setPasswordPolicy({
                          ...passwordPolicy,
                          requireSpecialCharacter: e.target.checked,
                        })
                      }
                    />
                    <span className="label-text">要求包含特殊字元 (!@#$%^&*)</span>
                  </label>
                </div>
              </div>

              <div className="divider" />

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">密碼歷史記錄</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-base-content/60">不可重複使用前</span>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    className="input input-bordered w-20"
                    value={passwordPolicy.passwordHistoryCount}
                    onChange={(e) =>
                      setPasswordPolicy({
                        ...passwordPolicy,
                        passwordHistoryCount: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <span className="text-sm text-base-content/60">組密碼 (0 = 不限制)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="btn btn-success"
              onClick={handleSavePasswordPolicy}
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  <span className="iconify lucide--save size-5" />
                  儲存設定
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 驗證碼設定 Tab */}
      {activeTab === 'captcha' && (
        <div className="space-y-6">
          {/* 基本設定 */}
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h3 className="card-title">驗證碼設定</h3>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-success"
                    checked={captchaSettings.enabled}
                    onChange={(e) =>
                      setCaptchaSettings({ ...captchaSettings, enabled: e.target.checked })
                    }
                  />
                  <div>
                    <span className="label-text font-medium">啟用驗證碼</span>
                    <p className="text-sm text-base-content/60">
                      在登入、註冊等頁面顯示驗證碼
                    </p>
                  </div>
                </label>
              </div>

              {captchaSettings.enabled && (
                <>
                  <div className="divider" />

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">驗證碼類型</span>
                    </label>
                    <select
                      className="select select-bordered w-full max-w-xs"
                      value={captchaSettings.captchaType}
                      onChange={(e) =>
                        setCaptchaSettings({
                          ...captchaSettings,
                          captchaType: parseInt(e.target.value) as CaptchaType,
                          imageCaptcha: {
                            ...captchaSettings.imageCaptcha,
                            enableAudio: false,
                          },
                        })
                      }
                    >
                      <option value={CaptchaType.ImageCode}>圖片驗證碼</option>
                      <option value={CaptchaType.Turnstile}>Cloudflare Turnstile</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 適用場景 */}
          {captchaSettings.enabled && (
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h3 className="card-title">適用場景</h3>
                <p className="text-sm text-base-content/60 mb-4">
                  選擇需要驗證碼的頁面
                </p>

                <div className="space-y-3">
                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-4">
                      <input
                        type="checkbox"
                        className="toggle toggle-success"
                        checked={captchaSettings.scenarios.adminLogin}
                        onChange={(e) =>
                          setCaptchaSettings({
                            ...captchaSettings,
                            scenarios: {
                              ...captchaSettings.scenarios,
                              adminLogin: e.target.checked,
                            },
                          })
                        }
                      />
                      <span className="label-text">管理員登入</span>
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-4">
                      <input
                        type="checkbox"
                        className="toggle toggle-success"
                        checked={captchaSettings.scenarios.memberLogin}
                        onChange={(e) =>
                          setCaptchaSettings({
                            ...captchaSettings,
                            scenarios: {
                              ...captchaSettings.scenarios,
                              memberLogin: e.target.checked,
                            },
                          })
                        }
                      />
                      <span className="label-text">會員登入</span>
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-4">
                      <input
                        type="checkbox"
                        className="toggle toggle-success"
                        checked={captchaSettings.scenarios.memberRegister}
                        onChange={(e) =>
                          setCaptchaSettings({
                            ...captchaSettings,
                            scenarios: {
                              ...captchaSettings.scenarios,
                              memberRegister: e.target.checked,
                            },
                          })
                        }
                      />
                      <span className="label-text">會員註冊</span>
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-4">
                      <input
                        type="checkbox"
                        className="toggle toggle-success"
                        checked={captchaSettings.scenarios.forgotPassword}
                        onChange={(e) =>
                          setCaptchaSettings({
                            ...captchaSettings,
                            scenarios: {
                              ...captchaSettings.scenarios,
                              forgotPassword: e.target.checked,
                            },
                          })
                        }
                      />
                      <span className="label-text">忘記密碼</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Turnstile 設定 */}
          {captchaSettings.enabled && captchaSettings.captchaType === CaptchaType.Turnstile && (
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h3 className="card-title">Cloudflare Turnstile 設定</h3>
                <p className="text-sm text-base-content/60 mb-4">
                  請前往 <a href="https://dash.cloudflare.com/sign-up?to=/:account/turnstile" target="_blank" rel="noopener noreferrer" className="link link-primary">Cloudflare Dashboard</a> 取得金鑰
                </p>

                <div className="grid grid-cols-1 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Site Key（網站金鑰）</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      placeholder="0x4AAAAAAA..."
                      value={captchaSettings.turnstile.siteKey}
                      onChange={(e) =>
                        setCaptchaSettings({
                          ...captchaSettings,
                          turnstile: {
                            ...captchaSettings.turnstile,
                            siteKey: e.target.value,
                          },
                        })
                      }
                    />
                    <label className="label">
                      <span className="label-text-alt text-base-content/60">
                        用於前端顯示 Turnstile widget
                      </span>
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Secret Key（秘密金鑰）</span>
                    </label>
                    <input
                      type="password"
                      className="input input-bordered"
                      placeholder="0x4AAAAAAA..."
                      value={captchaSettings.turnstile.secretKey}
                      onChange={(e) =>
                        setCaptchaSettings({
                          ...captchaSettings,
                          turnstile: {
                            ...captchaSettings.turnstile,
                            secretKey: e.target.value,
                          },
                        })
                      }
                    />
                    <label className="label">
                      <span className="label-text-alt text-base-content/60">
                        用於後端驗證，請妥善保管
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 圖片驗證碼設定 */}
          {captchaSettings.enabled && captchaSettings.captchaType === CaptchaType.ImageCode && (
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h3 className="card-title">圖片驗證碼設定</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">驗證碼長度</span>
                    </label>
                    <input
                      type="number"
                      min="4"
                      max="8"
                      className="input input-bordered"
                      value={captchaSettings.imageCaptcha.codeLength}
                      onChange={(e) =>
                        setCaptchaSettings({
                          ...captchaSettings,
                          imageCaptcha: {
                            ...captchaSettings.imageCaptcha,
                            codeLength: parseInt(e.target.value) || 4,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">過期時間（秒）</span>
                    </label>
                    <input
                      type="number"
                      min="60"
                      max="300"
                      className="input input-bordered"
                      value={captchaSettings.imageCaptcha.expirationSeconds}
                      onChange={(e) =>
                        setCaptchaSettings({
                          ...captchaSettings,
                          imageCaptcha: {
                            ...captchaSettings.imageCaptcha,
                            expirationSeconds: parseInt(e.target.value) || 120,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">最大嘗試次數</span>
                    </label>
                    <input
                      type="number"
                      min="3"
                      max="10"
                      className="input input-bordered"
                      value={captchaSettings.imageCaptcha.maxAttempts}
                      onChange={(e) =>
                        setCaptchaSettings({
                          ...captchaSettings,
                          imageCaptcha: {
                            ...captchaSettings.imageCaptcha,
                            maxAttempts: parseInt(e.target.value) || 5,
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="divider" />

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className="toggle toggle-success"
                      checked={captchaSettings.imageCaptcha.enableAudio}
                      onChange={(e) =>
                        setCaptchaSettings({
                          ...captchaSettings,
                          imageCaptcha: {
                            ...captchaSettings.imageCaptcha,
                            enableAudio: e.target.checked,
                          },
                        })
                      }
                    />
                    <div>
                      <span className="label-text font-medium">啟用音訊驗證碼</span>
                      <p className="text-sm text-base-content/60">
                        提供無障礙支援，讓視障使用者可透過聆聽驗證碼
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              className="btn btn-success"
              onClick={handleSaveCaptchaSettings}
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  <span className="iconify lucide--save size-5" />
                  儲存設定
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* HTTP 安全性 Tab */}
      {activeTab === 'http-security' && (
        <div className="space-y-6">
          {/* 子分頁 */}
          <div className="tabs tabs-boxed bg-base-200 p-1">
            <button
              className={`tab ${httpSecuritySubTab === 'template' ? 'tab-active' : ''}`}
              onClick={() => setHttpSecuritySubTab('template')}
            >
              <span className="iconify lucide--layout-template mr-2 size-4" />
              快速模板
            </button>
            <button
              className={`tab ${httpSecuritySubTab === 'cookie' ? 'tab-active' : ''}`}
              onClick={() => setHttpSecuritySubTab('cookie')}
            >
              <span className="iconify lucide--cookie mr-2 size-4" />
              Cookie
            </button>
            <button
              className={`tab ${httpSecuritySubTab === 'headers' ? 'tab-active' : ''}`}
              onClick={() => setHttpSecuritySubTab('headers')}
            >
              <span className="iconify lucide--file-text mr-2 size-4" />
              Headers
            </button>
            <button
              className={`tab ${httpSecuritySubTab === 'csp' ? 'tab-active' : ''}`}
              onClick={() => setHttpSecuritySubTab('csp')}
            >
              <span className="iconify lucide--shield-check mr-2 size-4" />
              CSP
            </button>
            <button
              className={`tab ${httpSecuritySubTab === 'cors' ? 'tab-active' : ''}`}
              onClick={() => setHttpSecuritySubTab('cors')}
            >
              <span className="iconify lucide--globe mr-2 size-4" />
              CORS
            </button>
          </div>

          {/* 目前模板狀態 */}
          <div className="alert alert-info">
            <span className="iconify lucide--info size-5" />
            <span>
              目前使用模板：
              <span className={`badge ml-2 ${
                httpSecuritySettings.activeTemplate === 'strict' ? 'badge-error' :
                httpSecuritySettings.activeTemplate === 'standard' ? 'badge-primary' :
                httpSecuritySettings.activeTemplate === 'relaxed' ? 'badge-warning' :
                'badge-ghost'
              }`}>
                {httpSecuritySettings.activeTemplate === 'strict' ? '嚴格模式' :
                 httpSecuritySettings.activeTemplate === 'standard' ? '標準模式' :
                 httpSecuritySettings.activeTemplate === 'relaxed' ? '寬鬆模式' :
                 '自訂'}
              </span>
            </span>
          </div>

          {/* 快速模板 */}
          {httpSecuritySubTab === 'template' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {securityTemplates.map((template) => (
                  <div
                    key={template.name}
                    className={`card bg-base-100 shadow cursor-pointer hover:shadow-lg transition-shadow ${
                      httpSecuritySettings.activeTemplate === template.name ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleApplyTemplate(template.name)}
                  >
                    <div className="card-body">
                      <div className="flex items-center gap-2">
                        <span className={`iconify ${template.icon} size-6`} />
                        <h3 className="card-title text-base">{template.label}</h3>
                        {httpSecuritySettings.activeTemplate === template.name && (
                          <span className="badge badge-primary badge-sm">目前</span>
                        )}
                      </div>
                      <p className="text-sm text-base-content/60">{template.description}</p>
                      <div className="card-actions justify-end mt-2">
                        <button
                          className="btn btn-sm btn-outline"
                          disabled={isSaving || httpSecuritySettings.activeTemplate === template.name}
                        >
                          {isSaving ? <span className="loading loading-spinner loading-xs" /> : '套用'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Nginx 管理 */}
              <div className="card bg-base-100 shadow">
                <div className="card-body">
                  <h3 className="card-title">Nginx 設定管理</h3>
                  <p className="text-sm text-base-content/60">
                    管理 Nginx Security Headers 設定檔，重新載入後 Nginx 會自動套用新設定
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      className="btn btn-success"
                      onClick={handleReloadNginx}
                      disabled={isReloading}
                    >
                      {isReloading ? (
                        <span className="loading loading-spinner loading-sm" />
                      ) : (
                        <span className="iconify lucide--refresh-cw size-5" />
                      )}
                      重新載入 Nginx
                    </button>
                    <button className="btn btn-outline" onClick={handleExportNginxConfig}>
                      <span className="iconify lucide--eye size-5" />
                      預覽設定
                    </button>
                    <button className="btn btn-primary" onClick={handleDownloadNginxConfig}>
                      <span className="iconify lucide--download size-5" />
                      下載設定檔
                    </button>
                  </div>
                  {nginxConfigPreview && (
                    <div className="mt-4">
                      <pre className="bg-base-200 p-4 rounded-lg text-xs overflow-x-auto max-h-64">
                        {nginxConfigPreview}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Cookie 設定 */}
          {httpSecuritySubTab === 'cookie' && (
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h3 className="card-title">Cookie 安全設定</h3>

                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-4">
                      <input
                        type="checkbox"
                        className="toggle toggle-success"
                        checked={httpSecuritySettings.cookie.httpOnly}
                        onChange={(e) =>
                          setHttpSecuritySettings({
                            ...httpSecuritySettings,
                            cookie: { ...httpSecuritySettings.cookie, httpOnly: e.target.checked },
                          })
                        }
                      />
                      <div>
                        <span className="label-text font-medium">HttpOnly</span>
                        <p className="text-sm text-base-content/60">
                          防止 JavaScript 存取 Cookie，減少 XSS 攻擊風險
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-4">
                      <input
                        type="checkbox"
                        className="toggle toggle-success"
                        checked={httpSecuritySettings.cookie.secure}
                        onChange={(e) =>
                          setHttpSecuritySettings({
                            ...httpSecuritySettings,
                            cookie: { ...httpSecuritySettings.cookie, secure: e.target.checked },
                          })
                        }
                      />
                      <div>
                        <span className="label-text font-medium">Secure</span>
                        <p className="text-sm text-base-content/60">
                          僅在 HTTPS 連線時傳送 Cookie
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="divider" />

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">SameSite</span>
                    </label>
                    <select
                      className="select select-bordered w-full max-w-xs"
                      value={httpSecuritySettings.cookie.sameSite}
                      onChange={(e) =>
                        setHttpSecuritySettings({
                          ...httpSecuritySettings,
                          cookie: { ...httpSecuritySettings.cookie, sameSite: e.target.value as 'Strict' | 'Lax' | 'None' },
                        })
                      }
                    >
                      <option value="Strict">Strict - 最嚴格，僅同站請求</option>
                      <option value="Lax">Lax - 允許部分跨站導航</option>
                      <option value="None">None - 允許跨站（需 Secure）</option>
                    </select>
                  </div>

                  <div className="divider" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">Access Token 效期 (分鐘)</span>
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="120"
                        className="input input-bordered"
                        value={httpSecuritySettings.cookie.accessTokenExpiryMinutes}
                        onChange={(e) =>
                          setHttpSecuritySettings({
                            ...httpSecuritySettings,
                            cookie: { ...httpSecuritySettings.cookie, accessTokenExpiryMinutes: parseInt(e.target.value) || 30 },
                          })
                        }
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">Refresh Token 效期 (天)</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        className="input input-bordered"
                        value={httpSecuritySettings.cookie.refreshTokenExpiryDays}
                        onChange={(e) =>
                          setHttpSecuritySettings({
                            ...httpSecuritySettings,
                            cookie: { ...httpSecuritySettings.cookie, refreshTokenExpiryDays: parseInt(e.target.value) || 7 },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Headers 設定 */}
          {httpSecuritySubTab === 'headers' && (
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h3 className="card-title">Security Headers</h3>

                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-4">
                      <input
                        type="checkbox"
                        className="toggle toggle-success"
                        checked={httpSecuritySettings.headers.enableXssProtection}
                        onChange={(e) =>
                          setHttpSecuritySettings({
                            ...httpSecuritySettings,
                            headers: { ...httpSecuritySettings.headers, enableXssProtection: e.target.checked },
                          })
                        }
                      />
                      <div>
                        <span className="label-text font-medium">X-XSS-Protection</span>
                        <p className="text-sm text-base-content/60">
                          啟用瀏覽器內建的 XSS 過濾器
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-4">
                      <input
                        type="checkbox"
                        className="toggle toggle-success"
                        checked={httpSecuritySettings.headers.enableContentTypeNosniff}
                        onChange={(e) =>
                          setHttpSecuritySettings({
                            ...httpSecuritySettings,
                            headers: { ...httpSecuritySettings.headers, enableContentTypeNosniff: e.target.checked },
                          })
                        }
                      />
                      <div>
                        <span className="label-text font-medium">X-Content-Type-Options: nosniff</span>
                        <p className="text-sm text-base-content/60">
                          防止瀏覽器 MIME 類型嗅探
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="divider" />

                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-4">
                      <input
                        type="checkbox"
                        className="toggle toggle-success"
                        checked={httpSecuritySettings.headers.enableFrameOptions}
                        onChange={(e) =>
                          setHttpSecuritySettings({
                            ...httpSecuritySettings,
                            headers: { ...httpSecuritySettings.headers, enableFrameOptions: e.target.checked },
                          })
                        }
                      />
                      <div>
                        <span className="label-text font-medium">X-Frame-Options</span>
                        <p className="text-sm text-base-content/60">
                          防止網頁被嵌入 iframe（Clickjacking 防護）
                        </p>
                      </div>
                    </label>
                  </div>

                  {httpSecuritySettings.headers.enableFrameOptions && (
                    <div className="form-control pl-14">
                      <select
                        className="select select-bordered w-full max-w-xs"
                        value={httpSecuritySettings.headers.frameOptionsPolicy}
                        onChange={(e) =>
                          setHttpSecuritySettings({
                            ...httpSecuritySettings,
                            headers: { ...httpSecuritySettings.headers, frameOptionsPolicy: e.target.value as 'DENY' | 'SAMEORIGIN' },
                          })
                        }
                      >
                        <option value="DENY">DENY - 完全禁止嵌入</option>
                        <option value="SAMEORIGIN">SAMEORIGIN - 僅同源可嵌入</option>
                      </select>
                    </div>
                  )}

                  <div className="divider" />

                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-4">
                      <input
                        type="checkbox"
                        className="toggle toggle-success"
                        checked={httpSecuritySettings.headers.enableHsts}
                        onChange={(e) =>
                          setHttpSecuritySettings({
                            ...httpSecuritySettings,
                            headers: { ...httpSecuritySettings.headers, enableHsts: e.target.checked },
                          })
                        }
                      />
                      <div>
                        <span className="label-text font-medium">HSTS (Strict-Transport-Security)</span>
                        <p className="text-sm text-base-content/60">
                          強制瀏覽器使用 HTTPS 連線
                        </p>
                      </div>
                    </label>
                  </div>

                  {httpSecuritySettings.headers.enableHsts && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-14">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Max-Age (秒)</span>
                        </label>
                        <input
                          type="number"
                          className="input input-bordered"
                          value={httpSecuritySettings.headers.hstsMaxAge}
                          onChange={(e) =>
                            setHttpSecuritySettings({
                              ...httpSecuritySettings,
                              headers: { ...httpSecuritySettings.headers, hstsMaxAge: parseInt(e.target.value) || 31536000 },
                            })
                          }
                        />
                        <label className="label">
                          <span className="label-text-alt">31536000 = 1 年</span>
                        </label>
                      </div>
                      <div className="form-control">
                        <label className="label cursor-pointer justify-start gap-4">
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={httpSecuritySettings.headers.hstsIncludeSubDomains}
                            onChange={(e) =>
                              setHttpSecuritySettings({
                                ...httpSecuritySettings,
                                headers: { ...httpSecuritySettings.headers, hstsIncludeSubDomains: e.target.checked },
                              })
                            }
                          />
                          <span className="label-text">包含子網域</span>
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="divider" />

                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-4">
                      <input
                        type="checkbox"
                        className="toggle toggle-success"
                        checked={httpSecuritySettings.headers.enableReferrerPolicy}
                        onChange={(e) =>
                          setHttpSecuritySettings({
                            ...httpSecuritySettings,
                            headers: { ...httpSecuritySettings.headers, enableReferrerPolicy: e.target.checked },
                          })
                        }
                      />
                      <div>
                        <span className="label-text font-medium">Referrer-Policy</span>
                        <p className="text-sm text-base-content/60">
                          控制 Referer header 的傳送策略
                        </p>
                      </div>
                    </label>
                  </div>

                  {httpSecuritySettings.headers.enableReferrerPolicy && (
                    <div className="form-control pl-14">
                      <select
                        className="select select-bordered w-full max-w-xs"
                        value={httpSecuritySettings.headers.referrerPolicy}
                        onChange={(e) =>
                          setHttpSecuritySettings({
                            ...httpSecuritySettings,
                            headers: { ...httpSecuritySettings.headers, referrerPolicy: e.target.value },
                          })
                        }
                      >
                        <option value="no-referrer">no-referrer</option>
                        <option value="no-referrer-when-downgrade">no-referrer-when-downgrade</option>
                        <option value="origin">origin</option>
                        <option value="origin-when-cross-origin">origin-when-cross-origin</option>
                        <option value="same-origin">same-origin</option>
                        <option value="strict-origin">strict-origin</option>
                        <option value="strict-origin-when-cross-origin">strict-origin-when-cross-origin (推薦)</option>
                      </select>
                    </div>
                  )}

                  <div className="divider" />

                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-4">
                      <input
                        type="checkbox"
                        className="toggle toggle-success"
                        checked={httpSecuritySettings.headers.enableCoep ?? false}
                        onChange={(e) =>
                          setHttpSecuritySettings({
                            ...httpSecuritySettings,
                            headers: { ...httpSecuritySettings.headers, enableCoep: e.target.checked },
                          })
                        }
                      />
                      <div>
                        <span className="label-text font-medium">Cross-Origin-Embedder-Policy (COEP)</span>
                        <p className="text-sm text-base-content/60">
                          防止跨來源資源未授權嵌入，需搭配 COOP 使用
                        </p>
                      </div>
                    </label>
                  </div>

                  {httpSecuritySettings.headers.enableCoep && (
                    <div className="form-control pl-14">
                      <select
                        className="select select-bordered w-full max-w-xs"
                        value={httpSecuritySettings.headers.coepPolicy ?? 'require-corp'}
                        onChange={(e) =>
                          setHttpSecuritySettings({
                            ...httpSecuritySettings,
                            headers: { ...httpSecuritySettings.headers, coepPolicy: e.target.value },
                          })
                        }
                      >
                        <option value="require-corp">require-corp (推薦)</option>
                        <option value="credentialless">credentialless</option>
                        <option value="unsafe-none">unsafe-none (停用)</option>
                      </select>
                    </div>
                  )}

                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-4">
                      <input
                        type="checkbox"
                        className="toggle toggle-success"
                        checked={httpSecuritySettings.headers.enableCoop ?? false}
                        onChange={(e) =>
                          setHttpSecuritySettings({
                            ...httpSecuritySettings,
                            headers: { ...httpSecuritySettings.headers, enableCoop: e.target.checked },
                          })
                        }
                      />
                      <div>
                        <span className="label-text font-medium">Cross-Origin-Opener-Policy (COOP)</span>
                        <p className="text-sm text-base-content/60">
                          隔離瀏覽器上下文群組，防止 Spectre 等跨視窗攻擊
                        </p>
                      </div>
                    </label>
                  </div>

                  {httpSecuritySettings.headers.enableCoop && (
                    <div className="form-control pl-14">
                      <select
                        className="select select-bordered w-full max-w-xs"
                        value={httpSecuritySettings.headers.coopPolicy ?? 'same-origin'}
                        onChange={(e) =>
                          setHttpSecuritySettings({
                            ...httpSecuritySettings,
                            headers: { ...httpSecuritySettings.headers, coopPolicy: e.target.value },
                          })
                        }
                      >
                        <option value="same-origin">same-origin (推薦)</option>
                        <option value="same-origin-allow-popups">same-origin-allow-popups</option>
                        <option value="unsafe-none">unsafe-none (停用)</option>
                      </select>
                    </div>
                  )}

                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-4">
                      <input
                        type="checkbox"
                        className="toggle toggle-success"
                        checked={httpSecuritySettings.headers.enableCorp ?? false}
                        onChange={(e) =>
                          setHttpSecuritySettings({
                            ...httpSecuritySettings,
                            headers: { ...httpSecuritySettings.headers, enableCorp: e.target.checked },
                          })
                        }
                      />
                      <div>
                        <span className="label-text font-medium">Cross-Origin-Resource-Policy (CORP)</span>
                        <p className="text-sm text-base-content/60">
                          控制資源可被哪些來源載入，防止跨站讀取攻擊
                        </p>
                      </div>
                    </label>
                  </div>

                  {httpSecuritySettings.headers.enableCorp && (
                    <div className="form-control pl-14">
                      <select
                        className="select select-bordered w-full max-w-xs"
                        value={httpSecuritySettings.headers.corpPolicy ?? 'same-origin'}
                        onChange={(e) =>
                          setHttpSecuritySettings({
                            ...httpSecuritySettings,
                            headers: { ...httpSecuritySettings.headers, corpPolicy: e.target.value },
                          })
                        }
                      >
                        <option value="same-origin">same-origin (推薦)</option>
                        <option value="same-site">same-site</option>
                        <option value="cross-origin">cross-origin (開放)</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CSP 設定 */}
          {httpSecuritySubTab === 'csp' && (
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h3 className="card-title">Content Security Policy (CSP)</h3>

                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-4">
                      <input
                        type="checkbox"
                        className="toggle toggle-success"
                        checked={httpSecuritySettings.csp.enabled}
                        onChange={(e) =>
                          setHttpSecuritySettings({
                            ...httpSecuritySettings,
                            csp: { ...httpSecuritySettings.csp, enabled: e.target.checked },
                          })
                        }
                      />
                      <div>
                        <span className="label-text font-medium">啟用 CSP</span>
                        <p className="text-sm text-base-content/60">
                          限制資源載入來源，防止 XSS 和資料注入攻擊
                        </p>
                      </div>
                    </label>
                  </div>

                  {httpSecuritySettings.csp.enabled && (
                    <>
                      <div className="form-control">
                        <label className="label cursor-pointer justify-start gap-4">
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={httpSecuritySettings.csp.reportOnly}
                            onChange={(e) =>
                              setHttpSecuritySettings({
                                ...httpSecuritySettings,
                                csp: { ...httpSecuritySettings.csp, reportOnly: e.target.checked },
                              })
                            }
                          />
                          <div>
                            <span className="label-text font-medium">Report-Only 模式</span>
                            <p className="text-sm text-base-content/60">
                              僅報告違規，不阻擋（測試用）
                            </p>
                          </div>
                        </label>
                      </div>

                      <div className="divider" />

                      <div className="alert alert-warning text-sm">
                        <span className="iconify lucide--alert-triangle size-5" />
                        <span>修改 CSP 設定可能導致網頁功能異常，建議先使用 Report-Only 模式測試</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">default-src</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered input-sm"
                            value={httpSecuritySettings.csp.defaultSrc}
                            onChange={(e) =>
                              setHttpSecuritySettings({
                                ...httpSecuritySettings,
                                csp: { ...httpSecuritySettings.csp, defaultSrc: e.target.value },
                              })
                            }
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">script-src</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered input-sm"
                            value={httpSecuritySettings.csp.scriptSrc}
                            onChange={(e) =>
                              setHttpSecuritySettings({
                                ...httpSecuritySettings,
                                csp: { ...httpSecuritySettings.csp, scriptSrc: e.target.value },
                              })
                            }
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">script-src-elem</span>
                            <span className="label-text-alt text-base-content/50">控制 &lt;script&gt; 元素，留空則繼承 script-src</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered input-sm"
                            placeholder="留空則繼承 script-src"
                            value={httpSecuritySettings.csp.scriptSrcElem ?? ''}
                            onChange={(e) =>
                              setHttpSecuritySettings({
                                ...httpSecuritySettings,
                                csp: { ...httpSecuritySettings.csp, scriptSrcElem: e.target.value || undefined },
                              })
                            }
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">script-src-attr</span>
                            <span className="label-text-alt text-base-content/50">控制 inline 事件處理器（onclick=""），留空則繼承 script-src</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered input-sm"
                            placeholder="留空則繼承 script-src"
                            value={httpSecuritySettings.csp.scriptSrcAttr ?? ''}
                            onChange={(e) =>
                              setHttpSecuritySettings({
                                ...httpSecuritySettings,
                                csp: { ...httpSecuritySettings.csp, scriptSrcAttr: e.target.value || undefined },
                              })
                            }
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">style-src</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered input-sm"
                            value={httpSecuritySettings.csp.styleSrc}
                            onChange={(e) =>
                              setHttpSecuritySettings({
                                ...httpSecuritySettings,
                                csp: { ...httpSecuritySettings.csp, styleSrc: e.target.value },
                              })
                            }
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">style-src-elem</span>
                            <span className="label-text-alt text-base-content/50">控制 &lt;style&gt; 元素和 &lt;link rel="stylesheet"&gt;，留空則繼承 style-src</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered input-sm"
                            placeholder="留空則繼承 style-src"
                            value={httpSecuritySettings.csp.styleSrcElem ?? ''}
                            onChange={(e) =>
                              setHttpSecuritySettings({
                                ...httpSecuritySettings,
                                csp: { ...httpSecuritySettings.csp, styleSrcElem: e.target.value || undefined },
                              })
                            }
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">style-src-attr</span>
                            <span className="label-text-alt text-base-content/50">控制 inline style="" 屬性，留空則繼承 style-src</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered input-sm"
                            placeholder="留空則繼承 style-src"
                            value={httpSecuritySettings.csp.styleSrcAttr ?? ''}
                            onChange={(e) =>
                              setHttpSecuritySettings({
                                ...httpSecuritySettings,
                                csp: { ...httpSecuritySettings.csp, styleSrcAttr: e.target.value || undefined },
                              })
                            }
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">img-src</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered input-sm"
                            value={httpSecuritySettings.csp.imgSrc}
                            onChange={(e) =>
                              setHttpSecuritySettings({
                                ...httpSecuritySettings,
                                csp: { ...httpSecuritySettings.csp, imgSrc: e.target.value },
                              })
                            }
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">font-src</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered input-sm"
                            value={httpSecuritySettings.csp.fontSrc}
                            onChange={(e) =>
                              setHttpSecuritySettings({
                                ...httpSecuritySettings,
                                csp: { ...httpSecuritySettings.csp, fontSrc: e.target.value },
                              })
                            }
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">media-src</span>
                            <span className="label-text-alt text-base-content/50">控制 &lt;audio&gt; 和 &lt;video&gt;，留空則繼承 default-src</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered input-sm"
                            placeholder="留空則繼承 default-src"
                            value={httpSecuritySettings.csp.mediaSrc ?? ''}
                            onChange={(e) =>
                              setHttpSecuritySettings({
                                ...httpSecuritySettings,
                                csp: { ...httpSecuritySettings.csp, mediaSrc: e.target.value || undefined },
                              })
                            }
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">connect-src</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered input-sm"
                            value={httpSecuritySettings.csp.connectSrc}
                            onChange={(e) =>
                              setHttpSecuritySettings({
                                ...httpSecuritySettings,
                                csp: { ...httpSecuritySettings.csp, connectSrc: e.target.value },
                              })
                            }
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">worker-src</span>
                            <span className="label-text-alt text-base-content/50">控制 Web Worker / Service Worker，留空則繼承 child-src 或 script-src</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered input-sm"
                            placeholder="留空則繼承 child-src 或 script-src"
                            value={httpSecuritySettings.csp.workerSrc ?? ''}
                            onChange={(e) =>
                              setHttpSecuritySettings({
                                ...httpSecuritySettings,
                                csp: { ...httpSecuritySettings.csp, workerSrc: e.target.value || undefined },
                              })
                            }
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">frame-src</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered input-sm"
                            value={httpSecuritySettings.csp.frameSrc}
                            onChange={(e) =>
                              setHttpSecuritySettings({
                                ...httpSecuritySettings,
                                csp: { ...httpSecuritySettings.csp, frameSrc: e.target.value },
                              })
                            }
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">frame-ancestors</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered input-sm"
                            value={httpSecuritySettings.csp.frameAncestors}
                            onChange={(e) =>
                              setHttpSecuritySettings({
                                ...httpSecuritySettings,
                                csp: { ...httpSecuritySettings.csp, frameAncestors: e.target.value },
                              })
                            }
                          />
                        </div>

                        <div className="form-control">
                          <label className="label cursor-pointer justify-start gap-4">
                            <input
                              type="checkbox"
                              className="toggle toggle-success toggle-sm"
                              checked={httpSecuritySettings.csp.upgradeInsecureRequests ?? false}
                              onChange={(e) =>
                                setHttpSecuritySettings({
                                  ...httpSecuritySettings,
                                  csp: { ...httpSecuritySettings.csp, upgradeInsecureRequests: e.target.checked },
                                })
                              }
                            />
                            <div>
                              <span className="label-text font-medium">upgrade-insecure-requests</span>
                              <p className="text-sm text-base-content/60">
                                自動將頁面內的 HTTP 請求升級為 HTTPS
                              </p>
                            </div>
                          </label>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CORS 設定 */}
          {httpSecuritySubTab === 'cors' && (
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h3 className="card-title">CORS 設定</h3>

                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-4">
                      <input
                        type="checkbox"
                        className="toggle toggle-success"
                        checked={httpSecuritySettings.cors.trustProxyHeaders}
                        onChange={(e) =>
                          setHttpSecuritySettings({
                            ...httpSecuritySettings,
                            cors: { ...httpSecuritySettings.cors, trustProxyHeaders: e.target.checked },
                          })
                        }
                      />
                      <div>
                        <span className="label-text font-medium">信任 Proxy Headers</span>
                        <p className="text-sm text-base-content/60">
                          信任 X-Forwarded-For、X-Real-IP 等 headers
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-4">
                      <input
                        type="checkbox"
                        className="toggle toggle-success"
                        checked={httpSecuritySettings.cors.allowCredentials}
                        onChange={(e) =>
                          setHttpSecuritySettings({
                            ...httpSecuritySettings,
                            cors: { ...httpSecuritySettings.cors, allowCredentials: e.target.checked },
                          })
                        }
                      />
                      <div>
                        <span className="label-text font-medium">允許憑證</span>
                        <p className="text-sm text-base-content/60">
                          允許跨域請求攜帶 Cookie
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="divider" />

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">允許的來源</span>
                    </label>
                    <div className="flex flex-wrap gap-2 p-2 min-h-[4rem] border border-base-300 rounded-lg bg-base-100 focus-within:border-primary transition-colors">
                      {httpSecuritySettings.cors.allowedOrigins.map((origin, idx) => (
                        <div key={idx} className="badge badge-primary gap-1 py-3 max-w-full">
                          <span className="text-sm truncate">{origin}</span>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs p-0 min-h-0 h-auto hover:text-error"
                            onClick={() =>
                              setHttpSecuritySettings({
                                ...httpSecuritySettings,
                                cors: {
                                  ...httpSecuritySettings.cors,
                                  allowedOrigins: httpSecuritySettings.cors.allowedOrigins.filter((_, i) => i !== idx),
                                },
                              })
                            }
                          >
                            <span className="iconify lucide--x size-3" />
                          </button>
                        </div>
                      ))}
                      <input
                        type="text"
                        className="flex-1 min-w-[220px] outline-none bg-transparent text-sm px-1"
                        placeholder="輸入來源後按 Enter，例如：https://example.com"
                        value={newOriginInput}
                        onChange={(e) => setNewOriginInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const value = newOriginInput.trim();
                            if (value && !httpSecuritySettings.cors.allowedOrigins.includes(value)) {
                              setHttpSecuritySettings({
                                ...httpSecuritySettings,
                                cors: {
                                  ...httpSecuritySettings.cors,
                                  allowedOrigins: [...httpSecuritySettings.cors.allowedOrigins, value],
                                },
                              });
                              setNewOriginInput('');
                            }
                          }
                        }}
                      />
                    </div>
                    <label className="label">
                      <span className="label-text-alt text-base-content/60">
                        留空表示使用環境變數設定
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 儲存按鈕 */}
          {httpSecuritySubTab !== 'template' && (
            <div className="flex justify-end">
              <button
                type="button"
                className="btn btn-success"
                onClick={handleSaveHttpSecuritySettings}
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <>
                    <span className="iconify lucide--save size-5" />
                    儲存設定
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* FIDO2 / Passkey 設定 Tab */}
      {activeTab === 'fido2' && (
        <div className="space-y-6">
          {/* 開關設定 */}
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h3 className="card-title">
                <span className="iconify lucide--fingerprint size-5" />
                Passkey 登入開關
              </h3>

              <div className="space-y-3 mt-2">
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className="toggle toggle-success"
                      checked={fido2Settings.enableForAdmin}
                      onChange={(e) =>
                        setFido2Settings({ ...fido2Settings, enableForAdmin: e.target.checked })
                      }
                    />
                    <div>
                      <span className="label-text font-medium">後台管理員 Passkey 登入</span>
                      <p className="text-sm text-base-content/60">
                        啟用後，後台登入頁面將顯示「使用 Passkey 登入」按鈕
                      </p>
                    </div>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className="toggle toggle-success"
                      checked={fido2Settings.enableForMember}
                      onChange={(e) =>
                        setFido2Settings({ ...fido2Settings, enableForMember: e.target.checked })
                      }
                    />
                    <div>
                      <span className="label-text font-medium">前台會員 Passkey 登入</span>
                      <p className="text-sm text-base-content/60">
                        啟用後，前台登入頁面將顯示「使用 Passkey 登入」按鈕
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 伺服器配置 */}
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h3 className="card-title">伺服器配置</h3>
              <p className="text-sm text-base-content/60">
                儲存後會寫入資料庫，優先於環境變數。留空則使用環境變數設定。
              </p>

              <div className="space-y-3 mt-2">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">伺服器網域 (RP ID)</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder={fido2Info?.serverDomain || '例如 isha.net'}
                    value={fido2Settings.serverDomain || ''}
                    onChange={(e) =>
                      setFido2Settings({ ...fido2Settings, serverDomain: e.target.value })
                    }
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">伺服器名稱</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder={fido2Info?.serverName || '例如 SPS Platform'}
                    value={fido2Settings.serverName || ''}
                    onChange={(e) =>
                      setFido2Settings({ ...fido2Settings, serverName: e.target.value })
                    }
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">允許的來源（每行一個）</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-24"
                    placeholder="https://sps.isha.net&#10;https://sps-admin.isha.net"
                    value={(fido2Settings.origins || []).join('\n')}
                    onChange={(e) =>
                      setFido2Settings({
                        ...fido2Settings,
                        origins: e.target.value.split('\n').map(s => s.trim()).filter(Boolean),
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="btn btn-success"
              onClick={async () => {
                setIsSaving(true);
                try {
                  await settingsApi.updateFido2Settings(fido2Settings);
                  await notify.success('FIDO2 設定已儲存');
                } catch {
                  await notify.error('儲存 FIDO2 設定失敗');
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  <span className="iconify lucide--save size-5" />
                  儲存設定
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 修改密碼 Tab */}
      {activeTab === 'change-password' && (
        <div className="card bg-base-100 shadow max-w-md">
          <div className="card-body">
            <h3 className="card-title">修改管理員密碼</h3>
            <p className="text-sm text-base-content/60 mb-4">
              請輸入目前密碼和新密碼來變更您的登入密碼
            </p>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">目前密碼</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">新密碼</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  required
                  minLength={passwordPolicy.minLength}
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60">
                    密碼長度至少 {passwordPolicy.minLength} 個字元
                  </span>
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">確認新密碼</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  required
                />
              </div>

              <div className="flex justify-end pt-4">
                <button type="submit" className="btn btn-success" disabled={isSaving}>
                  {isSaving ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    <>
                      <span className="iconify lucide--check size-5" />
                      確認修改
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
