import { useEffect, useState } from 'react';
import { pageSettingsApi, type PrivacyPolicySettings, type PrivacySection } from '@/lib/api/page-settings';
import { useNotify } from '@/hooks/useNotify';

const EMPTY: PrivacyPolicySettings = {
  title: '隱私權政策',
  updatedDate: '',
  sections: [],
  noticeEnabled: true,
  noticeMessage: '',
  noticeButtonText: '',
  noticeLinkText: '',
};

/**
 * 隱私權政策（前台 /privacy）與第一次造訪的 Cookie 告知橫幅。
 * 政策內容是「區塊」清單（標題＋內文），可新增、刪除、調整順序；內文是純文字：空一行＝新段落，以「- 」開頭的行＝項目符號，
 * 網址（http／https）與電子郵件在前台會自動變成連結。沒有設定過時是通用範本——上線前請客戶或法務確認內容。
 * 有自己的儲存按鈕；前台有 1 分鐘快取。
 */
export const PrivacyPolicySection = () => {
  const notify = useNotify();
  const [form, setForm] = useState<PrivacyPolicySettings>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    pageSettingsApi
      .getPrivacy()
      .then((data) => {
        if (!cancelled) setForm({ ...EMPTY, ...data, sections: data.sections ?? [] });
      })
      .catch(async () => {
        if (!cancelled) await notify.error('載入隱私權政策設定失敗');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSection = (index: number, patch: Partial<PrivacySection>) =>
    setForm((prev) => ({ ...prev, sections: prev.sections.map((s, i) => (i === index ? { ...s, ...patch } : s)) }));

  const moveSection = (index: number, delta: -1 | 1) =>
    setForm((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.sections.length) return prev;
      const sections = [...prev.sections];
      [sections[index], sections[target]] = [sections[target], sections[index]];
      return { ...prev, sections };
    });

  const handleSave = async () => {
    if (!form.title.trim()) {
      await notify.warning('請填寫政策頁標題');
      return;
    }
    if (form.noticeEnabled && (!form.noticeMessage.trim() || !form.noticeButtonText.trim())) {
      await notify.warning('開啟 Cookie 橫幅時，請填寫橫幅文字與按鈕文字');
      return;
    }
    setIsSaving(true);
    try {
      await pageSettingsApi.updatePrivacy(form);
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
      <div className="card-body space-y-5">
        <div>
          <h3 className="card-title text-lg">隱私權政策</h3>
          <p className="mt-1 text-sm text-base-content/70">
            前台頁尾「隱私權政策」連到的頁面（<code>/privacy</code>）。預設是通用範本，<b>上線前請客戶或法務確認內容</b>。
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="form-control sm:col-span-2">
            <span className="label-text mb-1 font-medium">
              頁面標題 <span className="text-error">*</span>
            </span>
            <input type="text" className="input input-bordered" maxLength={100} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </label>
          <label className="form-control">
            <span className="label-text mb-1 font-medium">最後更新日期</span>
            <input type="date" className="input input-bordered" value={form.updatedDate} onChange={(e) => setForm({ ...form, updatedDate: e.target.value })} />
            <span className="mt-1 text-xs text-base-content/50">不填就不顯示</span>
          </label>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="label-text font-medium">政策內容（{form.sections.length} 個區塊）</span>
            <span className="text-xs text-base-content/50">內文：空一行＝新段落；「- 」開頭＝項目符號；網址、電子郵件自動變連結</span>
          </div>

          {form.sections.map((section, index) => (
            <div key={index} className="rounded-box border border-base-300 p-3">
              <div className="mb-2 flex items-center gap-2">
                <div className="join">
                  <button type="button" className="btn btn-sm btn-ghost join-item" onClick={() => moveSection(index, -1)} disabled={index === 0} aria-label="上移" title="上移">
                    <span className="iconify lucide--arrow-up size-4" />
                  </button>
                  <button type="button" className="btn btn-sm btn-ghost join-item" onClick={() => moveSection(index, 1)} disabled={index === form.sections.length - 1} aria-label="下移" title="下移">
                    <span className="iconify lucide--arrow-down size-4" />
                  </button>
                </div>
                <input
                  type="text"
                  className="input input-bordered input-sm flex-1 font-medium"
                  placeholder="區塊標題，例如：一、適用範圍"
                  maxLength={100}
                  aria-label={`區塊 ${index + 1} 標題`}
                  value={section.title}
                  onChange={(e) => updateSection(index, { title: e.target.value })}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-ghost text-error"
                  onClick={() => setForm((prev) => ({ ...prev, sections: prev.sections.filter((_, i) => i !== index) }))}
                  aria-label={`刪除區塊 ${index + 1}`}
                  title="刪除這個區塊"
                >
                  <span className="iconify lucide--trash-2 size-4" />
                </button>
              </div>
              <textarea
                className="textarea textarea-bordered w-full text-sm leading-relaxed"
                rows={Math.min(14, Math.max(4, section.body.split('\n').length + 1))}
                maxLength={5000}
                placeholder="區塊內文"
                aria-label={`區塊 ${index + 1} 內文`}
                value={section.body}
                onChange={(e) => updateSection(index, { body: e.target.value })}
              />
            </div>
          ))}

          <button type="button" className="btn btn-sm btn-outline" onClick={() => setForm((prev) => ({ ...prev, sections: [...prev.sections, { title: '', body: '' }] }))}>
            <span className="iconify lucide--plus size-4" />
            新增區塊
          </button>
        </div>

        <div className="divider my-0" />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Cookie 告知橫幅</h4>
              <p className="text-sm text-base-content/70">訪客第一次造訪時顯示在畫面底部，按下按鈕後記住，不再顯示。只做告知，不影響網站追蹤。</p>
            </div>
            <label className="label cursor-pointer gap-2">
              <input type="checkbox" className="toggle toggle-primary" checked={form.noticeEnabled} onChange={(e) => setForm({ ...form, noticeEnabled: e.target.checked })} />
              <span className="label-text">{form.noticeEnabled ? '顯示橫幅' : '不顯示'}</span>
            </label>
          </div>

          {form.noticeEnabled && (
            <div className="space-y-3 rounded-box border border-base-300 p-4">
              <label className="form-control">
                <span className="label-text mb-1 font-medium">
                  橫幅文字 <span className="text-error">*</span>
                </span>
                <textarea className="textarea textarea-bordered" rows={2} maxLength={300} value={form.noticeMessage} onChange={(e) => setForm({ ...form, noticeMessage: e.target.value })} />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="form-control">
                  <span className="label-text mb-1 font-medium">
                    按鈕文字 <span className="text-error">*</span>
                  </span>
                  <input type="text" className="input input-bordered" maxLength={20} value={form.noticeButtonText} onChange={(e) => setForm({ ...form, noticeButtonText: e.target.value })} />
                </label>
                <label className="form-control">
                  <span className="label-text mb-1 font-medium">連到政策頁的連結文字</span>
                  <input type="text" className="input input-bordered" maxLength={30} placeholder="不填就不顯示連結" value={form.noticeLinkText} onChange={(e) => setForm({ ...form, noticeLinkText: e.target.value })} />
                </label>
              </div>

              <div>
                <span className="label-text mb-1 block text-xs text-base-content/60">預覽</span>
                <div className="flex flex-wrap items-center gap-3 rounded-box px-4 py-3 text-sm" style={{ background: '#0b4fb3', color: '#fff' }}>
                  <span className="min-w-48 flex-1">
                    {form.noticeMessage || '（橫幅文字）'}
                    {form.noticeLinkText && <span className="ml-2 underline">{form.noticeLinkText}</span>}
                  </span>
                  <span className="rounded-md px-3 py-1 text-xs font-medium" style={{ background: '#fff', color: '#0b4fb3' }}>
                    {form.noticeButtonText || '（按鈕）'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button type="button" className="btn btn-success" onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? <span className="loading loading-spinner loading-sm" /> : '儲存隱私權政策'}
          </button>
        </div>
      </div>
    </div>
  );
};
