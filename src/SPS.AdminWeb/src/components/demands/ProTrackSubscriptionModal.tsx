import { useEffect, useState } from 'react';
import { settingsApi } from '@/lib/api/system-settings';
import type { ProTrackSettings } from '@/types/settings';

interface Props {
  open: boolean;
  onClose: () => void;
}

type TestState = { status: 'idle' } | { status: 'testing' } | { status: 'ok'; message: string } | { status: 'fail'; message: string };

const DEFAULTS: ProTrackSettings = {
  baseUrl: 'https://protrack.isafe.org.tw/api/integrations/v1',
  apiKey: '',
  formId: '',
};

export const ProTrackSubscriptionModal = ({ open, onClose }: Props) => {
  const [settings, setSettings] = useState<ProTrackSettings>(DEFAULTS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [testState, setTestState] = useState<TestState>({ status: 'idle' });

  useEffect(() => {
    if (!open) return;
    setSaved(false);
    setSaveError(null);
    setTestState({ status: 'idle' });
    setIsLoading(true);
    settingsApi
      .getProTrackSettings()
      .then((data) => setSettings(data ?? DEFAULTS))
      .catch(() => setSettings(DEFAULTS))
      .finally(() => setIsLoading(false));
  }, [open]);

  const handleTest = async () => {
    setTestState({ status: 'testing' });
    try {
      const result = await settingsApi.testProTrackConnection(settings);
      setTestState(
        result.success
          ? { status: 'ok', message: result.message }
          : { status: 'fail', message: result.message ?? '連線失敗' }
      );
    } catch {
      setTestState({ status: 'fail', message: '無法連線，請確認網址與金鑰' });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      await settingsApi.updateProTrackSettings(settings);
      setSaved(true);
      setTimeout(onClose, 800);
    } catch {
      setSaveError('儲存失敗，請稍後再試');
    } finally {
      setIsSaving(false);
    }
  };

  const canTest = !isLoading && settings.apiKey.trim() && settings.baseUrl.trim() && settings.formId.trim();

  if (!open) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-lg">
        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={onClose}>
          ✕
        </button>
        <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
          <span className="iconify lucide--rss size-5" />
          管理訂閱設定
        </h3>
        <p className="text-sm text-base-content/60 mb-5">
          設定 ProTrack 整合的 API 連線資訊，供導入需求功能使用
        </p>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">API 基底網址</span>
              </label>
              <input
                type="url"
                className="input input-bordered"
                placeholder="https://protrack.isafe.org.tw/api/integrations/v1"
                value={settings.baseUrl}
                onChange={(e) => { setSettings({ ...settings, baseUrl: e.target.value }); setTestState({ status: 'idle' }); }}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">API Key</span>
              </label>
              <div className="join w-full">
                <input
                  type={showKey ? 'text' : 'password'}
                  className="input input-bordered join-item flex-1 font-mono text-sm"
                  placeholder="ptrk_live_..."
                  value={settings.apiKey}
                  onChange={(e) => { setSettings({ ...settings, apiKey: e.target.value }); setTestState({ status: 'idle' }); }}
                />
                <button
                  type="button"
                  className="btn btn-outline join-item"
                  onClick={() => setShowKey((v) => !v)}
                  tabIndex={-1}
                >
                  <span className={`iconify size-4 ${showKey ? 'lucide--eye-off' : 'lucide--eye'}`} />
                </button>
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">表單 ID（Form ID）</span>
              </label>
              <input
                type="text"
                className="input input-bordered font-mono text-sm"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={settings.formId}
                onChange={(e) => { setSettings({ ...settings, formId: e.target.value }); setTestState({ status: 'idle' }); }}
              />
            </div>

            {/* 測試結果 */}
            {testState.status === 'ok' && (
              <div className="alert alert-success py-2.5">
                <span className="iconify lucide--check-circle size-4" />
                <span className="text-sm">{testState.message}</span>
              </div>
            )}
            {testState.status === 'fail' && (
              <div className="alert alert-error py-2.5">
                <span className="iconify lucide--x-circle size-4" />
                <span className="text-sm">{testState.message}</span>
              </div>
            )}

            {/* 儲存回饋 */}
            {saveError && (
              <div className="alert alert-error py-2.5">
                <span className="iconify lucide--alert-circle size-4" />
                <span className="text-sm">{saveError}</span>
              </div>
            )}
            {saved && (
              <div className="alert alert-success py-2.5">
                <span className="iconify lucide--check-circle size-4" />
                <span className="text-sm">設定已儲存</span>
              </div>
            )}
          </div>
        )}

        <div className="modal-action flex-wrap gap-2">
          <button className="btn btn-ghost" onClick={onClose} disabled={isSaving}>
            取消
          </button>
          <div className="flex-1" />
          <button
            className="btn btn-outline"
            onClick={handleTest}
            disabled={!canTest || testState.status === 'testing' || isSaving}
          >
            {testState.status === 'testing' ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <span className="iconify lucide--plug-zap size-4" />
            )}
            測試連線
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isLoading || isSaving}
          >
            {isSaving ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <>
                <span className="iconify lucide--save size-4" />
                儲存設定
              </>
            )}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
};
