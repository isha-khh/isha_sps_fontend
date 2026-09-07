import { useState, useEffect } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { TabSelector } from '@/components/common/TabSelector';
import { settingsApi } from '@/lib/api/system-settings';
import { siteCounterApi } from '@/lib/api/site-counter';
import { siteStatisticsApi } from '@/lib/api/site-statistics';
import { filesManagementApi } from '@/lib/api/files-management';
import type { EmailSettings, GoogleAnalyticsSettings, FileStorageSettings, BounceMailSettings, BounceProcessingResult, ContentSettings, MembershipGuideSettings, EmbeddingSettings, EmbeddingTestResult } from '@/types/settings';
import type { SiteCounter } from '@/types/site-counter';
import type { SiteStatistics } from '@/types/site-statistics';
import { useNotify } from '@/hooks/useNotify';

type SettingTab = 'email' | 'analytics' | 'fileStorage' | 'siteCounter' | 'siteStatistics' | 'content' | 'membershipGuide' | 'embedding';

const SETTING_TABS = [
  { value: 'email' as const, label: '電子郵件', icon: 'lucide--mail' },
  { value: 'analytics' as const, label: 'Google Analytics', icon: 'lucide--bar-chart' },
  { value: 'fileStorage' as const, label: '檔案儲存', icon: 'lucide--hard-drive' },
  { value: 'siteCounter' as const, label: '網站計數器', icon: 'lucide--users' },
  { value: 'siteStatistics' as const, label: '網站統計數據', icon: 'lucide--trophy' },
  { value: 'content' as const, label: '內容設定', icon: 'lucide--layout' },
  { value: 'membershipGuide' as const, label: '會員申請須知', icon: 'lucide--file-text' },
  { value: 'embedding' as const, label: 'AI 語意搜尋', icon: 'lucide--sparkles' },
];

export const SystemConfigPage = () => {
  const notify = useNotify();
  const [activeTab, setActiveTab] = useState<SettingTab>('email');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Email settings
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    isEnabled: true,
    smtpServer: '',
    port: 587,
    userName: '',
    password: '',
    senderName: '',
    senderEmail: '',
    enableSsl: true,
  });

  // Google Analytics settings
  const [analyticsSettings, setAnalyticsSettings] = useState<GoogleAnalyticsSettings>({
    propertyId: '',
    credentialsJson: '',
  });

  // File Storage settings
  const [fileStorageSettings, setFileStorageSettings] = useState<FileStorageSettings>({
    uploadPath: '',
    allowedExtensions: '',
    maxFileSizeInMB: 10,
  });

  // Site Counter settings
  const [siteCounter, setSiteCounter] = useState<SiteCounter>({
    totalVisitors: 0,
    totalPageViews: 0,
  });

  // Site Statistics settings
  const [siteStatistics, setSiteStatistics] = useState<SiteStatistics>({
    totalMembers: 0,
    successfulMatches: 0,
    subsidyApplications: 0,
  });
  const [realTotalMembers, setRealTotalMembers] = useState<number>(0);

  // Bounce Mail settings
  const [bounceMailSettings, setBounceMailSettings] = useState<BounceMailSettings>({
    enabled: false,
    imapServer: '',
    imapPort: 993,
    useSsl: true,
    username: '',
    password: '',
    folder: 'INBOX',
    deleteAfterProcessing: false,
    moveToFolder: 'Processed',
    checkIntervalMinutes: 5,
  });
  const [isTesting, setIsTesting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<BounceProcessingResult | null>(null);

  // Content settings
  const [contentSettings, setContentSettings] = useState<ContentSettings>({
    guestCanViewBusinessDetail: true,
    showBusinessListTags: true,
    showBusinessListIntroduction: false,
    businessListIntroductionMaxLength: 100,
  });

  // Membership Guide settings
  const [membershipGuideSettings, setMembershipGuideSettings] = useState<MembershipGuideSettings>({
    guidePdfFileUrl: '',
    guidePdfFileName: '',
    guideDocxFileUrl: '',
    guideDocxFileName: '',
  });
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [isUploadingDocx, setIsUploadingDocx] = useState(false);

  // AI 語意搜尋設定
  const [embeddingSettings, setEmbeddingSettings] = useState<EmbeddingSettings>({
    isEnabled: false,
    baseUrl: '',
    apiKey: '',
    model: '',
    queryInstructionPrefix: '',
  });
  const [showEmbeddingKey, setShowEmbeddingKey] = useState(false);
  const [embeddingTestState, setEmbeddingTestState] = useState<
    { status: 'idle' } | { status: 'testing' } | { status: 'done'; result: EmbeddingTestResult }
  >({ status: 'idle' });

  useEffect(() => {
    void fetchAllSettings();
  }, []);

  const fetchAllSettings = async () => {
    setIsLoading(true);
    try {
      const [email, analytics, fileStorage, counter, statistics, bounceMail, content, membershipGuide, embedding] = await Promise.all([
        settingsApi.getEmailSettings(),
        settingsApi.getGoogleAnalyticsSettings(),
        settingsApi.getFileStorageSettings(),
        siteCounterApi.getAdminCounter(),
        siteStatisticsApi.getAdminStatistics(),
        settingsApi.getBounceMailSettings().catch(() => bounceMailSettings),
        settingsApi.getContentSettings().catch(() => contentSettings),
        settingsApi.getMembershipGuideSettings().catch(() => membershipGuideSettings),
        settingsApi.getEmbeddingSettings().catch(() => embeddingSettings),
      ]);
      setEmailSettings(email);
      setAnalyticsSettings(analytics);
      setFileStorageSettings(fileStorage);
      setSiteCounter(counter);
      setSiteStatistics(statistics);
      setRealTotalMembers(statistics.totalMembers);
      setBounceMailSettings(bounceMail);
      setContentSettings(content);
      setMembershipGuideSettings(membershipGuide);
      setEmbeddingSettings(embedding);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await settingsApi.updateEmailSettings(emailSettings);
      await notify.success('電子郵件設定已儲存');
    } catch (error) {
      console.error('Failed to save email settings:', error);
      await notify.error('儲存電子郵件設定失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAnalytics = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await settingsApi.updateGoogleAnalyticsSettings(analyticsSettings);
      await notify.success('Google Analytics 設定已儲存');
    } catch (error) {
      console.error('Failed to save analytics settings:', error);
      await notify.error('儲存 Google Analytics 設定失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFileStorage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await settingsApi.updateFileStorageSettings(fileStorageSettings);
      await notify.success('檔案儲存設定已儲存');
    } catch (error) {
      console.error('Failed to save file storage settings:', error);
      await notify.error('儲存檔案儲存設定失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSiteCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await siteCounterApi.setCounter(siteCounter);
      setSiteCounter(updated);
      await notify.success('網站計數器已儲存');
    } catch (error) {
      console.error('Failed to save site counter:', error);
      await notify.error('儲存網站計數器失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSiteStatistics = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await siteStatisticsApi.setStatistics({
        successfulMatches: siteStatistics.successfulMatches,
        subsidyApplications: siteStatistics.subsidyApplications,
      });
      setSiteStatistics(updated);
      setRealTotalMembers(updated.totalMembers);
      await notify.success('網站統計數據已儲存');
    } catch (error) {
      console.error('Failed to save site statistics:', error);
      await notify.error('儲存網站統計數據失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBounceMail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await settingsApi.updateBounceMailSettings(bounceMailSettings);
      await notify.success('退信處理設定已儲存');
    } catch (error) {
      console.error('Failed to save bounce mail settings:', error);
      await notify.error('儲存退信處理設定失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestImapConnection = async () => {
    setIsTesting(true);
    try {
      const result = await settingsApi.testImapConnection(bounceMailSettings);
      await notify.error(result.success ? result.message : `連線失敗: ${result.message}`);
    } catch (error) {
      console.error('Failed to test IMAP connection:', error);
      await notify.error('測試連線失敗');
    } finally {
      setIsTesting(false);
    }
  };

  const handleProcessBounces = async () => {
    setIsProcessing(true);
    setProcessResult(null);
    try {
      const result = await settingsApi.processBounces();
      const isSuccess = result.success === true || (result.error === undefined && result.totalFound !== undefined);
      setProcessResult({ ...result, success: isSuccess });
      if (isSuccess) {
        await notify.info(`處理完成：找到 ${result.totalFound} 封，處理 ${result.processedCount} 封`);
      } else {
        await notify.error(`處理失敗: ${result.error || '未知錯誤'}`);
      }
    } catch (error) {
      console.error('Failed to process bounces:', error);
      await notify.error('手動處理退信失敗');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await settingsApi.updateContentSettings(contentSettings);
      await notify.success('內容設定已儲存');
    } catch (error) {
      console.error('Failed to save content settings:', error);
      await notify.error('儲存內容設定失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadGuidePdf = async (file: File) => {
    setIsUploadingPdf(true);
    try {
      const uploaded = await filesManagementApi.uploadFile({
        file,
        description: '會員申請須知 PDF',
        isPublic: true,
      });
      setMembershipGuideSettings((prev) => ({
        ...prev,
        guidePdfFileUrl: uploaded.fileUrl,
        guidePdfFileName: file.name.replace(/\.[^/.]+$/, ''),
      }));
      await notify.success('PDF 已上傳，請記得按下方「儲存設定」');
    } catch (error) {
      console.error('Failed to upload guide PDF:', error);
      await notify.error('上傳 PDF 失敗');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleUploadGuideDocx = async (file: File) => {
    setIsUploadingDocx(true);
    try {
      const uploaded = await filesManagementApi.uploadFile({
        file,
        description: '可編輯申請須知附件',
        isPublic: true,
      });
      setMembershipGuideSettings((prev) => ({
        ...prev,
        guideDocxFileUrl: uploaded.fileUrl,
        guideDocxFileName: file.name.replace(/\.[^/.]+$/, ''),
      }));
      await notify.success('DOCX 已上傳，請記得按下方「儲存設定」');
    } catch (error) {
      console.error('Failed to upload guide DOCX:', error);
      await notify.error('上傳 DOCX 失敗');
    } finally {
      setIsUploadingDocx(false);
    }
  };

  const handleSaveMembershipGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await settingsApi.updateMembershipGuideSettings(membershipGuideSettings);
      await notify.success('會員申請須知設定已儲存');
    } catch (error) {
      console.error('Failed to save membership guide settings:', error);
      await notify.error('儲存會員申請須知設定失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmbeddingConnection = async () => {
    setEmbeddingTestState({ status: 'testing' });
    try {
      const result = await settingsApi.testEmbeddingConnection(embeddingSettings);
      setEmbeddingTestState({ status: 'done', result });
    } catch {
      setEmbeddingTestState({ status: 'done', result: { success: false, message: '無法連線，請確認位址與金鑰' } });
    }
  };

  const handleSaveEmbedding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await settingsApi.updateEmbeddingSettings(embeddingSettings);
      await notify.success('AI 語意搜尋設定已儲存');
    } catch (error) {
      console.error('Failed to save embedding settings:', error);
      await notify.error('儲存 AI 語意搜尋設定失敗');
    } finally {
      setIsSaving(false);
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
        title="系統配置"
        items={[
          { label: '系統管理', path: '/system' },
          { label: '系統配置', active: true },
        ]}
      />

      <TabSelector
        tabs={SETTING_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Email Settings */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          {/* SMTP Settings */}
          <form onSubmit={handleSaveEmail}>
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h3 className="card-title">
                  <span className="iconify lucide--send size-5" />
                  寄件設定 (SMTP)
                </h3>

                {/* 郵件服務啟用開關 */}
                <div className="form-control mb-4">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className={`toggle ${emailSettings.isEnabled ? 'toggle-success' : 'toggle-error'}`}
                      checked={emailSettings.isEnabled}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, isEnabled: e.target.checked })
                      }
                    />
                    <div>
                      <span className="label-text font-medium">
                        {emailSettings.isEnabled ? '郵件服務已啟用' : '郵件服務已停用'}
                      </span>
                      <p className="text-sm text-base-content/60">
                        {emailSettings.isEnabled
                          ? '系統將正常發送所有郵件通知'
                          : '停用後系統將不會發送任何郵件（密碼重設、驗證碼、通知等）'}
                      </p>
                    </div>
                  </label>
                </div>

                {!emailSettings.isEnabled ? (
                  <div className="alert alert-warning">
                    <span className="iconify lucide--alert-triangle size-5" />
                    <span>郵件服務已停用，所有郵件功能將無法使用，包括密碼重設、驗證碼發送等。</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">
                          SMTP 伺服器 <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        placeholder="smtp.example.com"
                        value={emailSettings.smtpServer}
                        onChange={(e) =>
                          setEmailSettings({ ...emailSettings, smtpServer: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">
                          端口 <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered"
                        placeholder="587"
                        value={emailSettings.port}
                        onChange={(e) =>
                          setEmailSettings({ ...emailSettings, port: parseInt(e.target.value) })
                        }
                        required
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">
                          使用者名稱 <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        placeholder="帳號"
                        value={emailSettings.userName}
                        onChange={(e) =>
                          setEmailSettings({ ...emailSettings, userName: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">密碼</span>
                        <span className="label-text-alt">留空表示不修改</span>
                      </label>
                      <input
                        type="password"
                        className="input input-bordered"
                        placeholder="密碼"
                        value={emailSettings.password || ''}
                        onChange={(e) =>
                          setEmailSettings({ ...emailSettings, password: e.target.value })
                        }
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">
                          寄件者名稱 <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        placeholder="系統管理員"
                        value={emailSettings.senderName}
                        onChange={(e) =>
                          setEmailSettings({ ...emailSettings, senderName: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">
                          寄件者信箱 <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="email"
                        className="input input-bordered"
                        placeholder="noreply@example.com"
                        value={emailSettings.senderEmail}
                        onChange={(e) =>
                          setEmailSettings({ ...emailSettings, senderEmail: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="form-control md:col-span-2">
                      <label className="label cursor-pointer justify-start gap-4">
                        <input
                          type="checkbox"
                          className="toggle toggle-success"
                          checked={emailSettings.enableSsl}
                          onChange={(e) =>
                            setEmailSettings({ ...emailSettings, enableSsl: e.target.checked })
                          }
                        />
                        <div>
                          <span className="label-text font-medium">啟用 SSL/TLS</span>
                          <p className="text-sm text-base-content/60">建議啟用以確保連線安全</p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                <div className="flex justify-end mt-4">
                  <button type="submit" className="btn btn-success" disabled={isSaving}>
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
            </div>
          </form>

          {/* Bounce Mail Settings - 僅在郵件服務啟用時顯示 */}
          {emailSettings.isEnabled && (
            <form onSubmit={handleSaveBounceMail}>
              <div className="card bg-base-100 shadow">
                <div className="card-body">
                  <h3 className="card-title">
                    <span className="iconify lucide--mail-x size-5" />
                    退信處理設定 (IMAP)
                  </h3>

                  <div className="form-control mb-4">
                    <label className="label cursor-pointer justify-start gap-4">
                      <input
                        type="checkbox"
                        className="toggle toggle-success"
                        checked={bounceMailSettings.enabled}
                        onChange={(e) =>
                          setBounceMailSettings({ ...bounceMailSettings, enabled: e.target.checked })
                        }
                      />
                      <div>
                        <span className="label-text font-medium">啟用自動退信處理</span>
                        <p className="text-sm text-base-content/60">
                          定期連線 IMAP 信箱檢查退信並自動記錄
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">
                          IMAP 伺服器 <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        placeholder="imap.example.com"
                        value={bounceMailSettings.imapServer}
                        onChange={(e) =>
                          setBounceMailSettings({ ...bounceMailSettings, imapServer: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">
                          端口 <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered"
                        placeholder="993"
                        value={bounceMailSettings.imapPort}
                        onChange={(e) =>
                          setBounceMailSettings({ ...bounceMailSettings, imapPort: parseInt(e.target.value) || 993 })
                        }
                        required
                      />
                      <label className="label">
                        <span className="label-text-alt">SSL: 993, TLS: 143</span>
                      </label>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">
                          帳號 <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        placeholder="bounce@example.com"
                        value={bounceMailSettings.username}
                        onChange={(e) =>
                          setBounceMailSettings({ ...bounceMailSettings, username: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">密碼</span>
                        <span className="label-text-alt">留空表示不修改</span>
                      </label>
                      <input
                        type="password"
                        className="input input-bordered"
                        placeholder="密碼"
                        value={bounceMailSettings.password}
                        onChange={(e) =>
                          setBounceMailSettings({ ...bounceMailSettings, password: e.target.value })
                        }
                      />
                    </div>

                    <div className="form-control md:col-span-2">
                      <label className="label cursor-pointer justify-start gap-4">
                        <input
                          type="checkbox"
                          className="toggle toggle-success"
                          checked={bounceMailSettings.useSsl}
                          onChange={(e) =>
                            setBounceMailSettings({ ...bounceMailSettings, useSsl: e.target.checked })
                          }
                        />
                        <div>
                          <span className="label-text font-medium">啟用 SSL/TLS</span>
                          <p className="text-sm text-base-content/60">建議啟用以確保連線安全</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="divider text-sm">資料夾與處理設定</div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">監控資料夾</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        placeholder="INBOX"
                        value={bounceMailSettings.folder}
                        onChange={(e) =>
                          setBounceMailSettings({ ...bounceMailSettings, folder: e.target.value })
                        }
                      />
                      <label className="label">
                        <span className="label-text-alt">要監控退信的信箱資料夾</span>
                      </label>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">
                          檢查間隔（分鐘） <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered"
                        placeholder="5"
                        min="1"
                        max="1440"
                        value={bounceMailSettings.checkIntervalMinutes}
                        onChange={(e) =>
                          setBounceMailSettings({ ...bounceMailSettings, checkIntervalMinutes: parseInt(e.target.value) || 5 })
                        }
                        required
                      />
                    </div>

                    <div className="form-control">
                      <label className="label cursor-pointer justify-start gap-4">
                        <input
                          type="checkbox"
                          className="toggle toggle-warning"
                          checked={bounceMailSettings.deleteAfterProcessing}
                          onChange={(e) =>
                            setBounceMailSettings({ ...bounceMailSettings, deleteAfterProcessing: e.target.checked })
                          }
                        />
                        <div>
                          <span className="label-text font-medium">處理後刪除郵件</span>
                          <p className="text-sm text-base-content/60">
                            啟用後，處理完成的退信郵件將被刪除
                          </p>
                        </div>
                      </label>
                    </div>

                    {!bounceMailSettings.deleteAfterProcessing && (
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">處理後移動到</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered"
                          placeholder="Processed"
                          value={bounceMailSettings.moveToFolder}
                          onChange={(e) =>
                            setBounceMailSettings({ ...bounceMailSettings, moveToFolder: e.target.value })
                          }
                        />
                        <label className="label">
                          <span className="label-text-alt">處理完成後移動到此資料夾</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* 測試與手動處理 */}
                  <div className="divider text-sm">測試與手動處理</div>

                  <div className="flex flex-wrap gap-4">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={handleTestImapConnection}
                      disabled={isTesting || !bounceMailSettings.imapServer || !bounceMailSettings.username}
                    >
                      {isTesting ? (
                        <span className="loading loading-spinner loading-sm" />
                      ) : (
                        <span className="iconify lucide--plug size-4" />
                      )}
                      測試連線
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline btn-info btn-sm"
                      onClick={handleProcessBounces}
                      disabled={isProcessing || !bounceMailSettings.enabled}
                    >
                      {isProcessing ? (
                        <span className="loading loading-spinner loading-sm" />
                      ) : (
                        <span className="iconify lucide--play size-4" />
                      )}
                      立即處理退信
                    </button>
                  </div>

                  {processResult && (
                    <div className={`alert mt-4 ${processResult.success ? 'alert-success' : 'alert-error'}`}>
                      <span className={`iconify ${processResult.success ? 'lucide--check-circle' : 'lucide--x-circle'} size-5`} />
                      <div>
                        {processResult.success ? (
                          <>
                            <p className="font-medium">處理完成</p>
                            <p className="text-sm">
                              找到 {processResult.totalFound} 封，處理 {processResult.processedCount} 封，
                              跳過 {processResult.skippedCount} 封，錯誤 {processResult.errorCount} 封
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-medium">處理失敗</p>
                            <p className="text-sm">{processResult.error}</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="alert alert-info mt-4">
                    <span className="iconify lucide--info size-5" />
                    <div>
                      <p className="font-medium">退信處理說明</p>
                      <ul className="text-sm list-disc list-inside mt-1">
                        <li>系統會自動識別 DSN (Delivery Status Notification) 格式的退信</li>
                        <li>支援識別硬退信 (5xx) 和軟退信 (4xx)</li>
                        <li>退信資訊會記錄在郵件日誌中，方便追蹤無效信箱</li>
                        <li>建議使用專用信箱接收退信，以避免混淆</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <button type="submit" className="btn btn-success" disabled={isSaving}>
                      {isSaving ? (
                        <span className="loading loading-spinner loading-sm" />
                      ) : (
                        <>
                          <span className="iconify lucide--save size-5" />
                          儲存退信處理設定
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Google Analytics Settings */}
      {activeTab === 'analytics' && (
        <form onSubmit={handleSaveAnalytics}>
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h3 className="card-title">Google Analytics 設定</h3>
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      Property ID <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="properties/1234567890"
                    value={analyticsSettings.propertyId}
                    onChange={(e) =>
                      setAnalyticsSettings({ ...analyticsSettings, propertyId: e.target.value })
                    }
                    required
                  />
                  <label className="label">
                    <span className="label-text-alt">
                      例如: properties/1234567890
                    </span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      服務帳號 JSON 憑證 <span className="text-error">*</span>
                    </span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered font-mono text-sm h-64"
                    placeholder='{"type": "service_account", ...}'
                    value={analyticsSettings.credentialsJson}
                    onChange={(e) =>
                      setAnalyticsSettings({
                        ...analyticsSettings,
                        credentialsJson: e.target.value,
                      })
                    }
                    required
                  />
                  <label className="label">
                    <span className="label-text-alt">
                      從 Google Cloud Console 下載的服務帳號 JSON 金鑰
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button type="submit" className="btn btn-success" disabled={isSaving}>
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
        </form>
      )}

      {/* File Storage Settings */}
      {activeTab === 'fileStorage' && (
        <form onSubmit={handleSaveFileStorage}>
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h3 className="card-title">檔案儲存設定</h3>
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      上傳路徑 <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered font-mono"
                    placeholder="/var/www/uploads"
                    value={fileStorageSettings.uploadPath}
                    onChange={(e) =>
                      setFileStorageSettings({ ...fileStorageSettings, uploadPath: e.target.value })
                    }
                    required
                  />
                  <label className="label">
                    <span className="label-text-alt">檔案上傳的伺服器路徑</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      允許的副檔名 <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder=".jpg,.png,.pdf,.doc,.docx"
                    value={fileStorageSettings.allowedExtensions}
                    onChange={(e) =>
                      setFileStorageSettings({
                        ...fileStorageSettings,
                        allowedExtensions: e.target.value,
                      })
                    }
                    required
                  />
                  <label className="label">
                    <span className="label-text-alt">
                      以逗號分隔，例如: .jpg,.png,.pdf
                    </span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      最大檔案大小 (MB) <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    placeholder="10"
                    min="1"
                    max="1024"
                    value={fileStorageSettings.maxFileSizeInMB}
                    onChange={(e) =>
                      setFileStorageSettings({
                        ...fileStorageSettings,
                        maxFileSizeInMB: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                  <label className="label">
                    <span className="label-text-alt">單一檔案上傳大小限制</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button type="submit" className="btn btn-success" disabled={isSaving}>
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
        </form>
      )}

      {/* Site Counter Settings */}
      {activeTab === 'siteCounter' && (
        <form onSubmit={handleSaveSiteCounter}>
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h3 className="card-title">網站計數器</h3>
              <p className="text-sm text-base-content/60 mb-4">
                管理網站訪客數與頁面瀏覽數統計
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      總訪客數 <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    min="0"
                    value={siteCounter.totalVisitors}
                    onChange={(e) =>
                      setSiteCounter({ ...siteCounter, totalVisitors: parseInt(e.target.value) || 0 })
                    }
                    required
                  />
                  <label className="label">
                    <span className="label-text-alt">不重複訪客總數</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      總瀏覽數 <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    min="0"
                    value={siteCounter.totalPageViews}
                    onChange={(e) =>
                      setSiteCounter({ ...siteCounter, totalPageViews: parseInt(e.target.value) || 0 })
                    }
                    required
                  />
                  <label className="label">
                    <span className="label-text-alt">頁面瀏覽總數</span>
                  </label>
                </div>
              </div>

              <div className="alert alert-info mt-4">
                <span className="iconify lucide--info size-5" />
                <div>
                  <p className="font-medium">計數器說明</p>
                  <ul className="text-sm list-disc list-inside mt-1">
                    <li>訪客數：記錄不重複的網站訪客數量</li>
                    <li>瀏覽數：記錄所有頁面的瀏覽次數總和</li>
                    <li>前台透過 API 自動記錄訪問</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button type="submit" className="btn btn-success" disabled={isSaving}>
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
        </form>
      )}

      {/* Site Statistics Settings */}
      {activeTab === 'siteStatistics' && (
        <form onSubmit={handleSaveSiteStatistics}>
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h3 className="card-title">網站統計數據</h3>
              <p className="text-sm text-base-content/60 mb-4">
                手動設定顯示於前台的統計數據
              </p>
              <div className="alert alert-info mb-4">
                <span className="iconify lucide--users size-5" />
                <div>
                  <p className="font-medium">會員總數（系統自動計算）</p>
                  <p className="text-sm mt-1">
                    目前共 <strong>{realTotalMembers.toLocaleString()}</strong> 位會員，此數據由系統自動統計，無需手動設定。
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      媒合成功案例 <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    min="0"
                    value={siteStatistics.successfulMatches}
                    onChange={(e) =>
                      setSiteStatistics({ ...siteStatistics, successfulMatches: parseInt(e.target.value) || 0 })
                    }
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      媒合補助申請案次 <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    min="0"
                    value={siteStatistics.subsidyApplications}
                    onChange={(e) =>
                      setSiteStatistics({ ...siteStatistics, subsidyApplications: parseInt(e.target.value) || 0 })
                    }
                    required
                  />
                </div>
              </div>

              <div className="alert alert-info mt-4">
                <span className="iconify lucide--info size-5" />
                <div>
                  <p className="font-medium">統計數據說明</p>
                  <p className="text-sm mt-1">
                    這些數據將顯示在前台網站，供訪客參考。數據由管理員手動維護更新。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button type="submit" className="btn btn-success" disabled={isSaving}>
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
        </form>
      )}

      {/* Content Settings */}
      {activeTab === 'content' && (
        <form onSubmit={handleSaveContent}>
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h3 className="card-title">
                <span className="iconify lucide--layout size-5" />
                內容設定
              </h3>
              <p className="text-sm text-base-content/60 mb-4">
                控制前台網站內容的存取權限
              </p>

              <div className="space-y-4">
                {/* 訪客查看詳情 */}
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className={`toggle ${contentSettings.guestCanViewBusinessDetail ? 'toggle-success' : 'toggle-error'}`}
                      checked={contentSettings.guestCanViewBusinessDetail}
                      onChange={(e) =>
                        setContentSettings({ ...contentSettings, guestCanViewBusinessDetail: e.target.checked })
                      }
                    />
                    <div>
                      <span className="label-text font-medium">
                        {contentSettings.guestCanViewBusinessDetail ? '訪客可查看企業名錄詳情' : '企業名錄詳情需登入後才可查看'}
                      </span>
                      <p className="text-sm text-base-content/60">
                        {contentSettings.guestCanViewBusinessDetail
                          ? '未登入的訪客可以自由瀏覽企業名錄詳細資料'
                          : '關閉後，訪客須登入才能查看企業名錄詳細資料'}
                      </p>
                    </div>
                  </label>
                </div>

                {!contentSettings.guestCanViewBusinessDetail && (
                  <div className="alert alert-warning">
                    <span className="iconify lucide--alert-triangle size-5" />
                    <span>企業名錄詳情已設為需登入，未登入的訪客將看到登入提示頁面。</span>
                  </div>
                )}

                <div className="divider my-2" />

                {/* 企業列表標籤 */}
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className={`toggle ${contentSettings.showBusinessListTags ? 'toggle-success' : 'toggle-error'}`}
                      checked={contentSettings.showBusinessListTags}
                      onChange={(e) =>
                        setContentSettings({ ...contentSettings, showBusinessListTags: e.target.checked })
                      }
                    />
                    <div>
                      <span className="label-text font-medium">
                        {contentSettings.showBusinessListTags ? '企業列表顯示標籤' : '企業列表隱藏標籤'}
                      </span>
                      <p className="text-sm text-base-content/60">
                        控制企業名錄列表卡片上是否顯示標籤 badge
                      </p>
                    </div>
                  </label>
                </div>

                <div className="divider my-2" />

                {/* 企業列表關於我們 */}
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className={`toggle ${contentSettings.showBusinessListIntroduction ? 'toggle-success' : 'toggle-error'}`}
                      checked={contentSettings.showBusinessListIntroduction}
                      onChange={(e) =>
                        setContentSettings({ ...contentSettings, showBusinessListIntroduction: e.target.checked })
                      }
                    />
                    <div>
                      <span className="label-text font-medium">
                        {contentSettings.showBusinessListIntroduction ? '企業列表顯示關於我們' : '企業列表隱藏關於我們'}
                      </span>
                      <p className="text-sm text-base-content/60">
                        控制企業名錄列表卡片上是否顯示關於我們簡介
                      </p>
                    </div>
                  </label>
                </div>

                {contentSettings.showBusinessListIntroduction && (
                  <div className="form-control ml-16">
                    <label className="label">
                      <span className="label-text font-medium">最大顯示字元數</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered w-40"
                      min={10}
                      max={500}
                      value={contentSettings.businessListIntroductionMaxLength}
                      onChange={(e) =>
                        setContentSettings({
                          ...contentSettings,
                          businessListIntroductionMaxLength: Math.max(10, parseInt(e.target.value) || 100),
                        })
                      }
                    />
                    <label className="label">
                      <span className="label-text-alt">超過此字元數將截斷並顯示「…」</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button type="submit" className="btn btn-success" disabled={isSaving}>
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
        </form>
      )}

      {/* Membership Guide Settings */}
      {activeTab === 'membershipGuide' && (
        <form onSubmit={handleSaveMembershipGuide}>
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h3 className="card-title">
                <span className="iconify lucide--file-text size-5" />
                會員申請須知
              </h3>
              <p className="text-sm text-base-content/60 mb-4">
                上傳前台會員申請流程第一步顯示的須知文件，供申請人下載閱讀
              </p>

              <div className="space-y-6">
                {/* PDF 申請須知 */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      石化產業智慧化媒合與應用服務申請須知（PDF）
                    </span>
                  </label>

                  {membershipGuideSettings.guidePdfFileUrl && (
                    <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 mb-2">
                      <span className="iconify lucide--file-text size-5 text-red-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {membershipGuideSettings.guidePdfFileName || '已上傳的 PDF'}
                        </p>
                        <p className="text-xs text-base-content/50 truncate">
                          {membershipGuideSettings.guidePdfFileUrl}
                        </p>
                      </div>
                      <a
                        href={membershipGuideSettings.guidePdfFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-ghost btn-xs"
                      >
                        預覽
                      </a>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="application/pdf"
                    className="file-input file-input-bordered"
                    disabled={isUploadingPdf}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleUploadGuidePdf(file);
                      e.target.value = '';
                    }}
                  />
                  {isUploadingPdf && (
                    <label className="label">
                      <span className="label-text-alt flex items-center gap-2">
                        <span className="loading loading-spinner loading-xs" />
                        上傳中…
                      </span>
                    </label>
                  )}
                </div>

                <div className="divider my-2" />

                {/* DOCX 申請須知附件 */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">可編輯申請須知附件（DOCX）</span>
                  </label>

                  {membershipGuideSettings.guideDocxFileUrl && (
                    <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 mb-2">
                      <span className="iconify lucide--file-text size-5 text-blue-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {membershipGuideSettings.guideDocxFileName || '已上傳的 DOCX'}
                        </p>
                        <p className="text-xs text-base-content/50 truncate">
                          {membershipGuideSettings.guideDocxFileUrl}
                        </p>
                      </div>
                      <a
                        href={membershipGuideSettings.guideDocxFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-ghost btn-xs"
                      >
                        預覽
                      </a>
                    </div>
                  )}

                  <input
                    type="file"
                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="file-input file-input-bordered"
                    disabled={isUploadingDocx}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleUploadGuideDocx(file);
                      e.target.value = '';
                    }}
                  />
                  {isUploadingDocx && (
                    <label className="label">
                      <span className="label-text-alt flex items-center gap-2">
                        <span className="loading loading-spinner loading-xs" />
                        上傳中…
                      </span>
                    </label>
                  )}
                </div>
              </div>

              <div className="alert alert-info mt-4">
                <span className="iconify lucide--info size-5" />
                <div>
                  <p className="font-medium">說明</p>
                  <p className="text-sm mt-1">
                    上傳新檔案後，記得按下方「儲存設定」才會套用到前台會員申請頁面。
                    對應前台位置：註冊申請流程第一步（Step1）。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button type="submit" className="btn btn-success" disabled={isSaving}>
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
        </form>
      )}

      {/* AI 語意搜尋設定 */}
      {activeTab === 'embedding' && (
        <form onSubmit={handleSaveEmbedding}>
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h3 className="card-title">
                <span className="iconify lucide--sparkles size-5" />
                AI 語意搜尋設定
              </h3>
              <p className="text-sm text-base-content/60 mb-4">
                設定用於「相似供給端業者」AI 建議面板的 embedding 服務（透過 LiteLLM）
              </p>

              <div className="space-y-4">
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className={`toggle ${embeddingSettings.isEnabled ? 'toggle-success' : 'toggle-error'}`}
                      checked={embeddingSettings.isEnabled}
                      onChange={(e) =>
                        setEmbeddingSettings({ ...embeddingSettings, isEnabled: e.target.checked })
                      }
                    />
                    <div>
                      <span className="label-text font-medium">
                        {embeddingSettings.isEnabled ? 'AI 語意搜尋已啟用' : 'AI 語意搜尋已停用'}
                      </span>
                      <p className="text-sm text-base-content/60">
                        停用後「相似供給端業者」面板僅顯示標籤比對結果，背景索引服務也不會呼叫外部 AI 服務
                      </p>
                    </div>
                  </label>
                </div>

                <div className="divider my-2" />

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      LiteLLM 服務位址 <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="url"
                    className="input input-bordered"
                    placeholder="https://llm.example.com"
                    value={embeddingSettings.baseUrl}
                    onChange={(e) => {
                      setEmbeddingSettings({ ...embeddingSettings, baseUrl: e.target.value });
                      setEmbeddingTestState({ status: 'idle' });
                    }}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      API Key <span className="text-error">*</span>
                    </span>
                  </label>
                  <div className="join w-full">
                    <input
                      type={showEmbeddingKey ? 'text' : 'password'}
                      className="input input-bordered join-item flex-1 font-mono text-sm"
                      placeholder="sk-..."
                      value={embeddingSettings.apiKey}
                      onChange={(e) => {
                        setEmbeddingSettings({ ...embeddingSettings, apiKey: e.target.value });
                        setEmbeddingTestState({ status: 'idle' });
                      }}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline join-item"
                      onClick={() => setShowEmbeddingKey((v) => !v)}
                      tabIndex={-1}
                    >
                      <span className={`iconify size-4 ${showEmbeddingKey ? 'lucide--eye-off' : 'lucide--eye'}`} />
                    </button>
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      Embedding 模型名稱 <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered font-mono text-sm"
                    placeholder="qwen3-embedding"
                    value={embeddingSettings.model}
                    onChange={(e) => {
                      setEmbeddingSettings({ ...embeddingSettings, model: e.target.value });
                      setEmbeddingTestState({ status: 'idle' });
                    }}
                    required
                  />
                  <label className="label">
                    <span className="label-text-alt">依實測建議使用 qwen3-embedding（詳見設計文件）</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">查詢 Instruction Prefix（進階）</span>
                    <span className="label-text-alt">留空使用預設值</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-24 font-mono text-sm"
                    placeholder="Instruct: 根據以下工廠智慧化升級需求，找出最能提供對應技術方案或產品服務的供給端業者&#10;Query:"
                    value={embeddingSettings.queryInstructionPrefix ?? ''}
                    onChange={(e) =>
                      setEmbeddingSettings({ ...embeddingSettings, queryInstructionPrefix: e.target.value })
                    }
                  />
                </div>

                {/* 測試結果 */}
                {embeddingTestState.status === 'done' && embeddingTestState.result.success && (
                  <div className="alert alert-success py-2.5">
                    <span className="iconify lucide--check-circle size-4" />
                    <span className="text-sm">
                      {embeddingTestState.result.message}
                      {embeddingTestState.result.latencyMs != null && `（延遲 ${embeddingTestState.result.latencyMs}ms）`}
                    </span>
                  </div>
                )}
                {embeddingTestState.status === 'done' && !embeddingTestState.result.success && (
                  <div className="alert alert-error py-2.5">
                    <span className="iconify lucide--x-circle size-4" />
                    <span className="text-sm">{embeddingTestState.result.message}</span>
                  </div>
                )}
              </div>

              <div className="alert alert-info mt-4">
                <span className="iconify lucide--info size-5" />
                <div>
                  <p className="font-medium">說明</p>
                  <p className="text-sm mt-1">
                    測試連線會實際呼叫一次 embedding API，回傳向量維度供確認設定正確。
                    若維度跟目前已索引資料不同，代表換了模型，需要重新索引全部資料。
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleTestEmbeddingConnection}
                  disabled={
                    embeddingTestState.status === 'testing' ||
                    !embeddingSettings.baseUrl.trim() ||
                    !embeddingSettings.apiKey.trim() ||
                    !embeddingSettings.model.trim()
                  }
                >
                  {embeddingTestState.status === 'testing' ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    <span className="iconify lucide--plug-zap size-4" />
                  )}
                  測試連線
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button type="submit" className="btn btn-success" disabled={isSaving}>
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
        </form>
      )}
    </div>
  );
};
