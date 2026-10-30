import { useState, useEffect, useRef } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { TabSelector } from '@/components/common/TabSelector';
import { settingsApi } from '@/lib/api/system-settings';
import type { EmailSettings, GoogleAnalyticsSettings, FileStorageSettings, BounceMailSettings, BounceProcessingResult, ContentSettings, EmbeddingSettings, EmbeddingTestResult, EmbeddingIndexStatus } from '@/types/settings';
import { useNotify } from '@/hooks/useNotify';

type SettingTab = 'email' | 'analytics' | 'fileStorage' | 'content' | 'embedding';

const SETTING_TABS = [
  { value: 'email' as const, label: '電子郵件', icon: 'lucide--mail' },
  { value: 'analytics' as const, label: 'Google Analytics', icon: 'lucide--bar-chart' },
  { value: 'fileStorage' as const, label: '檔案儲存', icon: 'lucide--hard-drive' },
  { value: 'content' as const, label: '內容設定', icon: 'lucide--layout' },
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
    demandMatchThresholdPercent: 70,
  });

  // AI 語意搜尋設定
  const [embeddingSettings, setEmbeddingSettings] = useState<EmbeddingSettings>({
    isEnabled: false,
    baseUrl: '',
    apiKey: '',
    model: '',
    queryInstructionPrefix: '',
    reconcileIntervalMinutes: 5,
    reconcileBatchSize: 50,
  });
  const [showEmbeddingKey, setShowEmbeddingKey] = useState(false);
  const [embeddingTestState, setEmbeddingTestState] = useState<
    { status: 'idle' } | { status: 'testing' } | { status: 'done'; result: EmbeddingTestResult }
  >({ status: 'idle' });

  // AI 語意搜尋索引進度
  const [indexStatus, setIndexStatus] = useState<EmbeddingIndexStatus | null>(null);
  const [indexStatusError, setIndexStatusError] = useState(false);
  const [isIndexActionPending, setIsIndexActionPending] = useState(false);
  // 由本頁啟動全部重新索引後，等它跑完再通知
  const awaitingReindexDoneRef = useRef(false);

  useEffect(() => {
    void fetchAllSettings();
  }, []);

  // 切到 AI 語意搜尋分頁時載入索引進度；背景工作進行中每 3 秒更新，否則每 15 秒
  const indexBusy = indexStatus ? indexStatus.job.phase !== 'idle' || indexStatus.job.reindexQueued : false;
  useEffect(() => {
    if (activeTab !== 'embedding') return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const load = async () => {
      try {
        const status = await settingsApi.getEmbeddingIndexStatus();
        if (cancelled) return;
        setIndexStatus(status);
        setIndexStatusError(false);
      } catch {
        if (!cancelled) setIndexStatusError(true);
      }
      if (!cancelled) timer = setTimeout(load, indexBusy ? 3000 : 15000);
    };
    void load();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [activeTab, indexBusy]);

  const fetchAllSettings = async () => {
    setIsLoading(true);
    try {
      const [email, analytics, fileStorage, bounceMail, content, embedding] = await Promise.all([
        settingsApi.getEmailSettings(),
        settingsApi.getGoogleAnalyticsSettings(),
        settingsApi.getFileStorageSettings(),
        settingsApi.getBounceMailSettings().catch(() => bounceMailSettings),
        settingsApi.getContentSettings().catch(() => contentSettings),
        settingsApi.getEmbeddingSettings().catch(() => embeddingSettings),
      ]);
      setEmailSettings(email);
      setAnalyticsSettings(analytics);
      setFileStorageSettings(fileStorage);
      setBounceMailSettings(bounceMail);
      setContentSettings(content);
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

  // 全部重新索引跑完時通知（只在這個頁面開著、且是由本頁啟動時）
  useEffect(() => {
    if (!indexStatus || !awaitingReindexDoneRef.current) return;
    const job = indexStatus.job;
    if (job.phase !== 'idle' || job.reindexQueued || !job.reindexFinishedAt) return;

    awaitingReindexDoneRef.current = false;
    if (job.reindexFailed > 0) {
      notify.warning(
        `全部重新索引已完成：共處理 ${job.reindexProcessed} / ${job.reindexTotal} 筆，其中 ${job.reindexFailed} 筆失敗。請查看下方錯誤訊息。`,
        '重新索引完成（有失敗）'
      );
    } else {
      notify.success(`全部重新索引已完成：共處理 ${job.reindexProcessed} / ${job.reindexTotal} 筆。`, '重新索引完成');
    }
  }, [indexStatus]);

  const refreshIndexStatus = async () => {
    try {
      setIndexStatus(await settingsApi.getEmbeddingIndexStatus());
      setIndexStatusError(false);
    } catch {
      setIndexStatusError(true);
    }
  };

  const handleReindexAll = async () => {
    const ok = await notify.confirm(
      '將對所有需求與供給端企業重新產生向量，期間會呼叫外部 AI 服務（可能產生費用），筆數多時需要一段時間。' +
        '重新索引期間舊向量仍可使用，會陸續被新向量取代。確定要開始嗎？',
      '全部重新索引'
    );
    if (!ok) return;
    setIsIndexActionPending(true);
    try {
      await settingsApi.reindexEmbeddings();
      awaitingReindexDoneRef.current = true;
      await refreshIndexStatus();
    } catch (error) {
      console.error('Failed to start reindex:', error);
      const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error;
      await notify.error(message ?? '無法開始重新索引');
    } finally {
      setIsIndexActionPending(false);
    }
  };

  const handleScanNow = async () => {
    setIsIndexActionPending(true);
    try {
      await settingsApi.scanEmbeddingIndex();
      // 背景服務被喚醒後才會更新狀態，稍等再抓一次
      setTimeout(() => void refreshIndexStatus(), 1500);
    } catch (error) {
      console.error('Failed to trigger index scan:', error);
      const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error;
      await notify.error(message ?? '無法執行索引掃描');
    } finally {
      setIsIndexActionPending(false);
    }
  };

  const formatIndexTime = (value?: string | null) =>
    value ? new Date(value).toLocaleString('zh-TW', { hour12: false }) : '—';

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

      {/* 內容設定 */}
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

          <div className="card bg-base-100 shadow mt-6">
            <div className="card-body">
              <h3 className="card-title">
                <span className="iconify lucide--handshake size-5" />
                媒合對接
              </h3>
              <p className="text-sm text-base-content/60 mb-4">
                後台發布需求時，標籤符合度達到這個百分比的供應業者會預設勾選為通知對象。承辦人員只能逐一取消勾選，不能調整這個門檻。
              </p>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">通知符合度門檻（%）</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-40"
                  min={0}
                  max={100}
                  value={contentSettings.demandMatchThresholdPercent}
                  onChange={(e) =>
                    setContentSettings({
                      ...contentSettings,
                      demandMatchThresholdPercent: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)),
                    })
                  }
                />
                <label className="label">
                  <span className="label-text-alt">預設 70。需求的標籤有多少比例也出現在供應業者的標籤裡，達到此比例才會預設通知。</span>
                </label>
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

          <div className="card bg-base-100 shadow mt-6">
            <div className="card-body">
              <h3 className="card-title">
                <span className="iconify lucide--calendar-clock size-5" />
                索引排程
              </h3>
              <p className="text-sm text-base-content/60 mb-4">
                需求或企業資料異動時會即時更新索引；排程則定期掃描，補上漏掉的項目、重試失敗的項目，剛啟用時也靠它建立初次索引。
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">掃描間隔（分鐘）</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    min={1}
                    max={1440}
                    value={embeddingSettings.reconcileIntervalMinutes}
                    onChange={(e) =>
                      setEmbeddingSettings({
                        ...embeddingSettings,
                        reconcileIntervalMinutes: Math.min(1440, Math.max(1, parseInt(e.target.value) || 5)),
                      })
                    }
                  />
                  <label className="label">
                    <span className="label-text-alt">1–1440，預設 5。間隔越短，補漏與重試越快</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">每輪最多處理筆數</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    min={1}
                    max={500}
                    value={embeddingSettings.reconcileBatchSize}
                    onChange={(e) =>
                      setEmbeddingSettings({
                        ...embeddingSettings,
                        reconcileBatchSize: Math.min(500, Math.max(1, parseInt(e.target.value) || 50)),
                      })
                    }
                  />
                  <label className="label">
                    <span className="label-text-alt">1–500，預設 50。每筆都會呼叫一次 embedding API；全部重新索引也以此為批次大小</span>
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

      {/* AI 語意搜尋索引進度 */}
      {activeTab === 'embedding' && (
        <div className="card bg-base-100 shadow mt-6">
          <div className="card-body">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="card-title">
                <span className="iconify lucide--database-zap size-5" />
                索引進度
              </h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => void refreshIndexStatus()}>
                <span className="iconify lucide--refresh-cw size-4" />
                重新整理
              </button>
            </div>

            {indexStatusError && !indexStatus && (
              <div className="alert alert-error">
                <span className="iconify lucide--circle-x size-5" />
                <span className="text-sm">無法取得索引進度</span>
              </div>
            )}

            {!indexStatus && !indexStatusError && (
              <div className="flex justify-center py-6">
                <span className="loading loading-spinner" />
              </div>
            )}

            {indexStatus && (
              <div className="space-y-4">
                {!indexStatus.isEnabled && (
                  <div className="alert alert-warning">
                    <span className="iconify lucide--triangle-alert size-5" />
                    <span className="text-sm">AI 語意搜尋尚未啟用（或設定尚未儲存），背景不會建立索引。</span>
                  </div>
                )}

                {(
                  [
                    ['需求', indexStatus.counts.demand],
                    ['供給端企業', indexStatus.counts.company],
                  ] as const
                ).map(([label, c]) => (
                  <div key={label}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <span className="font-medium">{label}</span>
                      <span className="text-base-content/70">
                        已索引 {c.indexed} / {c.total}
                        {c.pending > 0 && <span className="ml-2">待處理 {c.pending}</span>}
                        {c.failed > 0 && <span className="ml-2 text-error">失敗 {c.failed}</span>}
                      </span>
                    </div>
                    <progress
                      className={`progress w-full ${c.failed > 0 ? 'progress-warning' : 'progress-success'}`}
                      value={c.total === 0 ? 0 : c.indexed}
                      max={c.total === 0 ? 1 : c.total}
                    />
                  </div>
                ))}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-base-content/70">
                  <div>目前模型：{indexStatus.activeModel ?? '—'}</div>
                  <div>最近索引寫入：{formatIndexTime(indexStatus.counts.lastIndexedAt)}</div>
                  <div>最近一次掃描：{formatIndexTime(indexStatus.job.lastScanAt)}
                    {indexStatus.job.lastScanAt && `（處理 ${indexStatus.job.lastScanProcessed} 筆）`}
                  </div>
                  <div>下次掃描：{indexStatus.isEnabled ? formatIndexTime(indexStatus.job.nextScanAt) : '—'}</div>
                </div>

                {indexStatus.counts.otherModelCount > 0 && (
                  <div className="alert alert-warning">
                    <span className="iconify lucide--triangle-alert size-5" />
                    <span className="text-sm">
                      有 {indexStatus.counts.otherModelCount} 筆向量是用其他模型建立的，不同模型的向量無法互相比對，
                      請執行「全部重新索引」。
                    </span>
                  </div>
                )}

                {indexStatus.counts.failedExhausted > 0 && (
                  <div className="alert alert-error">
                    <span className="iconify lucide--circle-x size-5" />
                    <div className="text-sm">
                      <p>有 {indexStatus.counts.failedExhausted} 筆已達重試上限（5 次），排程不會再自動重試。請確認連線設定，儲存設定後會重新嘗試（也可以直接執行「全部重新索引」）。</p>
                      {indexStatus.counts.lastError && (
                        <p className="mt-1 break-all text-base-content/70">最近一次錯誤：{indexStatus.counts.lastError}</p>
                      )}
                    </div>
                  </div>
                )}

                {indexStatus.job.reindexQueued && indexStatus.job.phase !== 'reindexing' && (
                  <div className="alert alert-info">
                    <span className="loading loading-spinner loading-sm" />
                    <span className="text-sm">已排入全部重新索引，等待背景服務開始…</span>
                  </div>
                )}

                {indexStatus.job.phase === 'reindexing' && (
                  <div>
                    <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <span className="font-medium">全部重新索引進行中</span>
                      <span className="text-base-content/70">
                        {indexStatus.job.reindexProcessed} / {indexStatus.job.reindexTotal}
                        {indexStatus.job.reindexFailed > 0 && (
                          <span className="ml-2 text-error">失敗 {indexStatus.job.reindexFailed}</span>
                        )}
                      </span>
                    </div>
                    <progress
                      className="progress progress-primary w-full"
                      value={indexStatus.job.reindexProcessed}
                      max={Math.max(1, indexStatus.job.reindexTotal)}
                    />
                  </div>
                )}

                {indexStatus.job.phase === 'scanning' && (
                  <div className="alert alert-info">
                    <span className="loading loading-spinner loading-sm" />
                    <span className="text-sm">正在掃描並補上缺漏的索引…</span>
                  </div>
                )}

                {indexStatus.job.phase === 'idle' && indexStatus.job.reindexFinishedAt && (
                  <p className="text-sm text-base-content/70">
                    上次全部重新索引：{formatIndexTime(indexStatus.job.reindexFinishedAt)}，共處理{' '}
                    {indexStatus.job.reindexProcessed} / {indexStatus.job.reindexTotal} 筆
                    {indexStatus.job.reindexFailed > 0 && `，其中失敗 ${indexStatus.job.reindexFailed} 筆`}
                  </p>
                )}

                {indexStatus.job.lastError && (
                  <div className="alert alert-error">
                    <span className="iconify lucide--circle-x size-5" />
                    <span className="text-sm break-all">背景索引發生錯誤：{indexStatus.job.lastError}</span>
                  </div>
                )}

                <div className="flex flex-wrap justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleScanNow}
                    disabled={!indexStatus.isEnabled || indexBusy || isIndexActionPending}
                  >
                    <span className="iconify lucide--scan-search size-4" />
                    立即掃描補漏
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleReindexAll}
                    disabled={!indexStatus.isEnabled || indexBusy || isIndexActionPending}
                  >
                    <span className="iconify lucide--refresh-ccw size-4" />
                    全部重新索引
                  </button>
                </div>
                <p className="text-xs text-base-content/60 text-right">
                  修改上方設定後請先按「儲存設定」，背景才會套用新的排程與模型。
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
