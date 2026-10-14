import { useEffect, useState } from 'react';
import { pageSettingsApi, type IndustryAiLinkSettings } from '@/lib/api/page-settings';
import { useNotify } from '@/hooks/useNotify';

const EMPTY: IndustryAiLinkSettings = { enabled: false, url: '', newTab: true };

/**
 * 「產業AI」外部連結開關：前台主選單「服務專區 → 技術工具 → 產業AI」、首頁服務專區輪播、網站導覽與投稿頁裡的「產業AI」連結。
 * 關閉（預設）＝維持原本的內部頁面（技術工具分類「產業AI」的內容列表）；開啟＝上述所有「產業AI」連結改連到這裡填的外部網址，
 * 直接輸入舊的 /serve?category=產業AI 網址也會被導向外部連結。關閉後恢復成原本的內部頁面，已填的網址會保留，下次開啟不用重填。
 * 有自己的儲存按鈕；前台有 1 分鐘快取。
 */
export const IndustryAiLinkSection = () => {
  const notify = useNotify();
  const [form, setForm] = useState<IndustryAiLinkSettings>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    pageSettingsApi
      .getIndustryAiLink()
      .then((data) => {
        if (!cancelled) setForm({ ...EMPTY, ...data });
      })
      .catch(async () => {
        if (!cancelled) await notify.error('載入產業AI外部連結設定失敗');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (form.enabled && !form.url.trim()) {
      await notify.warning('開啟外部連結時，請填寫外部連結網址');
      return;
    }
    setIsSaving(true);
    try {
      await pageSettingsApi.updateIndustryAiLink({ ...form, url: form.url.trim() });
      await notify.success('已儲存，前台最多 1 分鐘後更新');
    } catch (error) {
      const serverMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      await notify.error(serverMessage || '儲存失敗');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      {notify.NotifyComponent}
      <div className="card-body space-y-4">
        <h3 className="card-title text-lg">「產業AI」外部連結</h3>
        <p className="text-sm text-base-content/70">
          <b>關閉</b>：維持現在的功能，「產業AI」連到網站內的技術工具分類頁。
          <br />
          <b>開啟</b>：前台所有「產業AI」連結（主選單、首頁、網站導覽、投稿頁）改連到下面填的外部網址。
        </p>

        <label className="label cursor-pointer justify-start gap-4">
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={form.enabled}
            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
          />
          <span className="label-text font-medium">{form.enabled ? '使用外部連結（已開啟）' : '使用網站內的頁面（目前功能）'}</span>
        </label>

        {form.enabled && (
          <div className="space-y-3 rounded-box border border-base-300 p-4">
            <label className="form-control">
              <span className="label-text mb-1 font-medium">
                外部連結網址 <span className="text-error">*</span>
              </span>
              <input
                type="url"
                className="input input-bordered"
                placeholder="https://example.com/industry-ai"
                maxLength={500}
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
              <span className="label-text-alt mt-1 text-base-content/60">只接受 http:// 或 https:// 開頭的完整網址</span>
            </label>
            <label className="label cursor-pointer justify-start gap-3">
              <input type="checkbox" className="checkbox" checked={form.newTab} onChange={(e) => setForm({ ...form, newTab: e.target.checked })} />
              <span className="label-text">另開新視窗</span>
            </label>
          </div>
        )}

        <div className="flex justify-end">
          <button type="button" className="btn btn-primary" disabled={isSaving} onClick={() => void handleSave()}>
            {isSaving ? <span className="loading loading-spinner loading-sm" /> : <><span className="iconify lucide--save size-4" />儲存產業AI設定</>}
          </button>
        </div>
      </div>
    </div>
  );
};
