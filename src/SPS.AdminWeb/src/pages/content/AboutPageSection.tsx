import { useEffect, useState } from 'react';
import { pageSettingsApi, type AboutPageSettings } from '@/lib/api/page-settings';
import { useNotify } from '@/hooks/useNotify';

const EMPTY: AboutPageSettings = { title: '', intro: '', milestones: [], visionTitle: '', visionLine: '', visionHighlight: '' };

/**
 * 「關於我們」頁（前台 /about）的文字內容：計畫名稱與簡介、計畫歷程時間軸、願景標語。背景圖與台灣地圖是前台程式控制的圖形，
 * 這裡改不到。沒有設定過時顯示原本寫死的內容（後端預設值），所以第一次打開看到的就是目前前台的樣子。
 * 計畫歷程每一筆的「說明」一行一點。有自己的儲存按鈕；前台有 1 分鐘快取。
 */
export const AboutPageSection = () => {
  const notify = useNotify();
  const [form, setForm] = useState<AboutPageSettings>(EMPTY);
  // 歷程說明用多行文字編輯，一行一點；與 form.milestones 分開存，避免輸入中被空行吃掉
  const [lines, setLines] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    pageSettingsApi
      .getAbout()
      .then((data) => {
        if (cancelled) return;
        setForm({ ...EMPTY, ...data });
        setLines((data.milestones ?? []).map((m) => (m.items ?? []).join('\n')));
      })
      .catch(async () => {
        if (!cancelled) await notify.error('載入關於我們設定失敗');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateMilestone = (index: number, patch: Partial<{ year: string; title: string }>) =>
    setForm((prev) => ({ ...prev, milestones: prev.milestones.map((m, i) => (i === index ? { ...m, ...patch } : m)) }));

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= form.milestones.length) return;
    const swap = <T,>(arr: T[]) => {
      const next = [...arr];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    };
    setForm((prev) => ({ ...prev, milestones: swap(prev.milestones) }));
    setLines((prev) => swap(prev));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await pageSettingsApi.updateAbout({
        ...form,
        milestones: form.milestones.map((m, i) => ({ ...m, items: (lines[i] ?? '').split('\n').map((l) => l.trim()).filter(Boolean) })),
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
        <h3 className="card-title text-lg">關於我們（前台 /about 的文字）</h3>
        <p className="text-sm text-base-content/70">背景圖與台灣地圖不在這裡調整。計畫歷程「說明」一行一點；整筆空白的歷程儲存時會被丟掉。</p>

        <div className="grid grid-cols-1 gap-4">
          <label className="form-control">
            <span className="label-text font-medium mb-1">計畫名稱</span>
            <input className="input input-bordered" maxLength={100} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </label>
          <label className="form-control">
            <span className="label-text font-medium mb-1">計畫簡介</span>
            <textarea className="textarea textarea-bordered h-28" maxLength={1000} value={form.intro} onChange={(e) => setForm({ ...form, intro: e.target.value })} />
          </label>
        </div>

        <div className="divider my-1 text-sm font-semibold">計畫歷程</div>
        {form.milestones.map((m, index) => (
          <div className="rounded-box border border-base-300 p-4 space-y-3" key={index}>
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold">第 {index + 1} 筆</h4>
              <div className="flex gap-1">
                <button type="button" className="btn btn-ghost btn-xs" disabled={index === 0} aria-label="上移" onClick={() => move(index, -1)}>
                  <span className="iconify lucide--arrow-up size-3" />
                </button>
                <button type="button" className="btn btn-ghost btn-xs" disabled={index === form.milestones.length - 1} aria-label="下移" onClick={() => move(index, 1)}>
                  <span className="iconify lucide--arrow-down size-3" />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs text-error"
                  aria-label="刪除"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, milestones: prev.milestones.filter((_, i) => i !== index) }));
                    setLines((prev) => prev.filter((_, i) => i !== index));
                  }}
                >
                  <span className="iconify lucide--trash-2 size-3" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <label className="form-control">
                <span className="label-text mb-1">年份</span>
                <input className="input input-bordered" maxLength={20} value={m.year} onChange={(e) => updateMilestone(index, { year: e.target.value })} />
              </label>
              <label className="form-control md:col-span-3">
                <span className="label-text mb-1">標題</span>
                <input className="input input-bordered" maxLength={100} value={m.title} onChange={(e) => updateMilestone(index, { title: e.target.value })} />
              </label>
            </div>
            <label className="form-control">
              <span className="label-text mb-1">說明（一行一點）</span>
              <textarea
                className="textarea textarea-bordered h-24"
                value={lines[index] ?? ''}
                onChange={(e) => setLines((prev) => prev.map((l, i) => (i === index ? e.target.value : l)))}
              />
            </label>
          </div>
        ))}
        <div>
          <button
            type="button"
            className="btn btn-sm btn-neutral"
            disabled={form.milestones.length >= 12}
            onClick={() => {
              setForm((prev) => ({ ...prev, milestones: [...prev.milestones, { year: '', title: '', items: [] }] }));
              setLines((prev) => [...prev, '']);
            }}
          >
            <span className="iconify lucide--plus size-4" />
            新增一筆歷程
          </button>
        </div>

        <div className="divider my-1 text-sm font-semibold">願景</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="form-control">
            <span className="label-text mb-1">小標</span>
            <input className="input input-bordered" maxLength={50} value={form.visionTitle} onChange={(e) => setForm({ ...form, visionTitle: e.target.value })} />
          </label>
          <label className="form-control">
            <span className="label-text mb-1">標語</span>
            <input className="input input-bordered" maxLength={50} value={form.visionLine} onChange={(e) => setForm({ ...form, visionLine: e.target.value })} />
          </label>
          <label className="form-control">
            <span className="label-text mb-1">強調標語（顯示成強調色）</span>
            <input className="input input-bordered" maxLength={50} value={form.visionHighlight} onChange={(e) => setForm({ ...form, visionHighlight: e.target.value })} />
          </label>
        </div>

        <div className="flex justify-end">
          <button type="button" className="btn btn-primary" disabled={isSaving} onClick={() => void handleSave()}>
            {isSaving ? <span className="loading loading-spinner loading-sm" /> : <><span className="iconify lucide--save size-4" />儲存關於我們</>}
          </button>
        </div>
      </div>
    </div>
  );
};
