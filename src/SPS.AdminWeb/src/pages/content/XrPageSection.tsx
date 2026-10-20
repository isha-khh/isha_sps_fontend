import { useEffect, useState } from 'react';
import { pageSettingsApi, type XrPageSettings, type XrTab } from '@/lib/api/page-settings';
import { useNotify } from '@/hooks/useNotify';

const FIRE_WORK_ID = 'fire-work';
const MAX_TABS = 8;
const MAX_LINKS = 10;

/**
 * 「XR」頁（前台 /talent/xr）的頁籤維護（issue #37）：每個頁籤有自己的名稱、介紹文字與模組下載連結，順序就是前台頁籤的順序。
 * 沒設定過時是原本的兩個頁籤——「動火作業」（用前台內建的介紹版面，下載連結沿用「頁面設定 → 下載資源」的 XR 訓練模組）與「有機電操作」
 * （還沒有內容，前台顯示「敬請期待」）。有自己的儲存按鈕；前台有 1 分鐘快取。
 */
export const XrPageSection = () => {
  const notify = useNotify();
  const [tabs, setTabs] = useState<XrTab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    pageSettingsApi
      .getXr()
      .then((data: XrPageSettings) => {
        if (!cancelled) setTabs(data.tabs ?? []);
      })
      .catch(async () => {
        if (!cancelled) await notify.error('載入 XR 頁設定失敗');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateTab = (index: number, patch: Partial<XrTab>) => setTabs((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= tabs.length) return;
    setTabs((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await pageSettingsApi.updateXr({ tabs });
      // 重新載入：新增的頁籤識別碼是後端產生的
      setTabs((await pageSettingsApi.getXr()).tabs ?? []);
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
        <h3 className="card-title text-lg">XR 頁面（前台 /talent/xr）</h3>
        <p className="text-sm text-base-content/70">
          前台 XR 頁用頁籤切換，每個頁籤有自己的介紹與模組下載。頁籤順序就是下面的順序。沒有介紹、也沒有下載連結的頁籤，前台顯示「敬請期待」。
        </p>

        {tabs.map((tab, index) => {
          const isFireWork = tab.id === FIRE_WORK_ID;
          return (
            <div key={tab.id || `new-${index}`} className="rounded-box border border-base-300 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">
                  頁籤 {index + 1}
                  {isFireWork && <span className="badge badge-ghost badge-sm ml-2">內建「動火作業」</span>}
                </div>
                <div className="flex gap-1">
                  <button type="button" className="btn btn-xs btn-ghost" disabled={index === 0} onClick={() => move(index, -1)} aria-label="上移">
                    <span className="iconify lucide--arrow-up size-4" />
                  </button>
                  <button type="button" className="btn btn-xs btn-ghost" disabled={index === tabs.length - 1} onClick={() => move(index, 1)} aria-label="下移">
                    <span className="iconify lucide--arrow-down size-4" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost text-error"
                    disabled={tabs.length <= 1}
                    onClick={() => setTabs((prev) => prev.filter((_, i) => i !== index))}
                    aria-label="刪除頁籤"
                  >
                    <span className="iconify lucide--trash-2 size-4" />
                  </button>
                </div>
              </div>

              <label className="form-control">
                <span className="label-text mb-1">頁籤名稱</span>
                <input className="input input-bordered max-w-sm" maxLength={20} value={tab.label} onChange={(e) => updateTab(index, { label: e.target.value })} />
              </label>

              {isFireWork && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={tab.useBuiltInLayout} onChange={(e) => updateTab(index, { useBuiltInLayout: e.target.checked })} />
                  <span className="text-sm">使用內建的動火作業介紹版面（為什麼需要 XR、訓練情境、六階段流程、成效與使用須知）</span>
                </label>
              )}

              {!(isFireWork && tab.useBuiltInLayout) && (
                <label className="form-control">
                  <span className="label-text mb-1">介紹文字</span>
                  <textarea
                    className="textarea textarea-bordered h-32"
                    maxLength={3000}
                    placeholder="這個頁籤的介紹；用空白行分段，每一段前台顯示成一個段落"
                    value={tab.introduction}
                    onChange={(e) => updateTab(index, { introduction: e.target.value })}
                  />
                </label>
              )}

              <div className="space-y-2">
                <div className="label-text">模組下載連結</div>
                <p className="text-xs text-base-content/60">
                  外部網址（安裝檔通常放在雲端空間）；有多個時前台點「立即下載」會列出讓使用者選。
                  {isFireWork && tab.useBuiltInLayout && '內建版面的「動火作業」沒填連結時，沿用「頁面設定 → 下載資源」的 XR 訓練模組。'}
                </p>
                {tab.links.map((link, linkIndex) => (
                  <div key={linkIndex} className="grid grid-cols-1 md:grid-cols-12 gap-2">
                    <input
                      className="input input-bordered input-sm md:col-span-3"
                      placeholder="名稱，例如 Windows 版"
                      maxLength={100}
                      value={link.label}
                      onChange={(e) => updateTab(index, { links: tab.links.map((l, i) => (i === linkIndex ? { ...l, label: e.target.value } : l)) })}
                    />
                    <input
                      className="input input-bordered input-sm md:col-span-8"
                      placeholder="https://..."
                      maxLength={2000}
                      value={link.url}
                      onChange={(e) => updateTab(index, { links: tab.links.map((l, i) => (i === linkIndex ? { ...l, url: e.target.value } : l)) })}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost text-error md:col-span-1"
                      onClick={() => updateTab(index, { links: tab.links.filter((_, i) => i !== linkIndex) })}
                      aria-label="刪除連結"
                    >
                      <span className="iconify lucide--x size-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-xs btn-neutral"
                  disabled={tab.links.length >= MAX_LINKS}
                  onClick={() => updateTab(index, { links: [...tab.links, { label: '', url: '' }] })}
                >
                  <span className="iconify lucide--plus size-3" />
                  新增下載連結
                </button>
              </div>
            </div>
          );
        })}

        <div>
          <button
            type="button"
            className="btn btn-sm btn-neutral"
            disabled={tabs.length >= MAX_TABS}
            onClick={() => setTabs((prev) => [...prev, { id: '', label: '', useBuiltInLayout: false, introduction: '', links: [] }])}
          >
            <span className="iconify lucide--plus size-4" />
            新增頁籤
          </button>
        </div>

        <div className="flex justify-end">
          <button type="button" className="btn btn-primary" disabled={isSaving} onClick={() => void handleSave()}>
            {isSaving ? <span className="loading loading-spinner loading-sm" /> : <><span className="iconify lucide--save size-4" />儲存 XR 頁面</>}
          </button>
        </div>
      </div>
    </div>
  );
};
