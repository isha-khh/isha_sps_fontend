import { useEffect, useState } from 'react';
import { pageSettingsApi, type SupportInfoBlock } from '@/lib/api/page-settings';
import { useNotify } from '@/hooks/useNotify';

/** 圖示：Bootstrap Icons 名稱 → 中文說明（要跟後端 `ContentPageValidator.SupportIcons` 一致） */
const ICONS: Array<{ value: string; label: string }> = [
  { value: 'bi-person', label: '人物' },
  { value: 'bi-card-checklist', label: '清單' },
  { value: 'bi-currency-dollar', label: '金額' },
  { value: 'bi-telephone', label: '電話' },
  { value: 'bi-geo-alt', label: '地點' },
  { value: 'bi-building', label: '單位' },
  { value: 'bi-info-circle', label: '資訊' },
  { value: 'bi-calendar4-week', label: '日期' },
  { value: 'bi-file-earmark-text', label: '文件' },
  { value: 'bi-clipboard-check', label: '申請' },
];

/** 「完整內容請參閱〈…〉」可連到的下載資源（後台「下載資源」的項目，檔案在下方設定） */
const LINK_TARGETS: Array<{ value: string; label: string }> = [
  { value: 'support-notice', label: '申請須知' },
  { value: 'support-leaflet', label: '補助懶人包' },
  { value: 'support-plan', label: '計畫書格式' },
  { value: 'support-online-guide', label: '線上申請說明' },
  { value: 'support-qa', label: '常見問答' },
];

/** 編輯中的區塊：子項目用多行文字編輯（一行一個） */
interface Draft {
  icon: string;
  title: string;
  items: Array<{ label: string; children: string }>;
  linkKey: string;
  linkLabel: string;
}

const toDraft = (b: SupportInfoBlock): Draft => ({
  icon: b.icon,
  title: b.title,
  items: b.items.map((i) => ({ label: i.label, children: i.children.join('\n') })),
  linkKey: b.fullTextResourceKey ?? '',
  linkLabel: b.fullTextLabel ?? '',
});

/**
 * 補助專區（前台 /support）頁首的資訊區塊（預設是適用對象／補助類別／補助金額／聯繫諮詢）。每個區塊有圖示、標題、
 * 項目清單（項目底下可以有子項目，一行一個），也可以在底部加「完整內容請參閱〈…〉」連到下方「下載資源」設定的檔案。
 * 沒有設定過時顯示原本寫死的內容（後端預設值）。有自己的儲存按鈕；前台有 1 分鐘快取。
 */
export const SupportInfoSection = () => {
  const notify = useNotify();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    pageSettingsApi
      .getSupportInfo()
      .then((data) => {
        if (!cancelled) setDrafts((data.blocks ?? []).map(toDraft));
      })
      .catch(async () => {
        if (!cancelled) await notify.error('載入補助專區資訊區塊失敗');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patch = (index: number, change: Partial<Draft>) => setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...change } : d)));
  const patchItem = (index: number, itemIndex: number, change: Partial<Draft['items'][number]>) =>
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, items: d.items.map((it, j) => (j === itemIndex ? { ...it, ...change } : it)) } : d)));
  const moveBlock = (index: number, delta: -1 | 1) =>
    setDrafts((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await pageSettingsApi.updateSupportInfo({
        blocks: drafts.map((d) => ({
          icon: d.icon,
          title: d.title,
          items: d.items.map((i) => ({ label: i.label, children: i.children.split('\n').map((c) => c.trim()).filter(Boolean) })),
          fullTextResourceKey: d.linkKey || null,
          fullTextLabel: d.linkKey ? d.linkLabel : null,
        })),
      });
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
        <h3 className="card-title text-lg">補助專區頁首的資訊區塊（前台 /support）</h3>
        <p className="text-sm text-base-content/70">
          每個區塊一個圖示與標題，底下是項目清單；項目的「子項目」一行一個。整個空白的區塊儲存時會被丟掉。
        </p>

        {drafts.map((d, index) => (
          <div className="rounded-box border border-base-300 p-4 space-y-3" key={index}>
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold">區塊 {index + 1}</h4>
              <div className="flex gap-1">
                <button type="button" className="btn btn-ghost btn-xs" disabled={index === 0} aria-label="上移" onClick={() => moveBlock(index, -1)}>
                  <span className="iconify lucide--arrow-up size-3" />
                </button>
                <button type="button" className="btn btn-ghost btn-xs" disabled={index === drafts.length - 1} aria-label="下移" onClick={() => moveBlock(index, 1)}>
                  <span className="iconify lucide--arrow-down size-3" />
                </button>
                <button type="button" className="btn btn-ghost btn-xs text-error" aria-label="刪除區塊" onClick={() => setDrafts((prev) => prev.filter((_, i) => i !== index))}>
                  <span className="iconify lucide--trash-2 size-3" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <label className="form-control">
                <span className="label-text mb-1">圖示</span>
                <select className="select select-bordered" value={d.icon} onChange={(e) => patch(index, { icon: e.target.value })}>
                  {ICONS.map((icon) => (
                    <option key={icon.value} value={icon.value}>{icon.label}</option>
                  ))}
                </select>
              </label>
              <label className="form-control md:col-span-3">
                <span className="label-text mb-1">標題</span>
                <input className="input input-bordered" maxLength={50} value={d.title} onChange={(e) => patch(index, { title: e.target.value })} />
              </label>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">項目</div>
              {d.items.map((item, itemIndex) => (
                <div className="rounded-box bg-base-200/50 p-3 space-y-2" key={itemIndex}>
                  <div className="flex gap-2">
                    <input
                      className="input input-bordered input-sm flex-1"
                      placeholder="項目文字"
                      maxLength={500}
                      value={item.label}
                      onChange={(e) => patchItem(index, itemIndex, { label: e.target.value })}
                    />
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm text-error"
                      aria-label="刪除項目"
                      onClick={() => patch(index, { items: d.items.filter((_, j) => j !== itemIndex) })}
                    >
                      <span className="iconify lucide--x size-4" />
                    </button>
                  </div>
                  <textarea
                    className="textarea textarea-bordered w-full h-20 text-sm"
                    placeholder="子項目（一行一個，可不填）"
                    value={item.children}
                    onChange={(e) => patchItem(index, itemIndex, { children: e.target.value })}
                  />
                </div>
              ))}
              <button type="button" className="btn btn-xs btn-neutral" disabled={d.items.length >= 20} onClick={() => patch(index, { items: [...d.items, { label: '', children: '' }] })}>
                <span className="iconify lucide--plus size-3" />
                新增項目
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="form-control">
                <span className="label-text mb-1">底部「完整內容請參閱」連結</span>
                <select className="select select-bordered" value={d.linkKey} onChange={(e) => patch(index, { linkKey: e.target.value, linkLabel: d.linkLabel || LINK_TARGETS.find((t) => t.value === e.target.value)?.label || '' })}>
                  <option value="">不顯示</option>
                  {LINK_TARGETS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </label>
              {d.linkKey && (
                <label className="form-control">
                  <span className="label-text mb-1">連結文字</span>
                  <input className="input input-bordered" maxLength={50} value={d.linkLabel} onChange={(e) => patch(index, { linkLabel: e.target.value })} />
                </label>
              )}
            </div>
          </div>
        ))}

        <div>
          <button
            type="button"
            className="btn btn-sm btn-neutral"
            disabled={drafts.length >= 8}
            onClick={() => setDrafts((prev) => [...prev, { icon: 'bi-info-circle', title: '', items: [{ label: '', children: '' }], linkKey: '', linkLabel: '' }])}
          >
            <span className="iconify lucide--plus size-4" />
            新增區塊
          </button>
        </div>

        <div className="flex justify-end">
          <button type="button" className="btn btn-primary" disabled={isSaving} onClick={() => void handleSave()}>
            {isSaving ? <span className="loading loading-spinner loading-sm" /> : <><span className="iconify lucide--save size-4" />儲存資訊區塊</>}
          </button>
        </div>
      </div>
    </div>
  );
};
