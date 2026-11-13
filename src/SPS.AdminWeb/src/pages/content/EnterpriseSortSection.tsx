import { useEffect, useState } from 'react';
import { pageSettingsApi, type EnterpriseSortKey, type EnterpriseSortRule } from '@/lib/api/page-settings';
import { useNotify } from '@/hooks/useNotify';

/** 每個排序依據的說明與兩個方向的文字（前台企業名錄的排序規則） */
const CRITERIA: Record<EnterpriseSortKey, { label: string; hint: string; high: string; low: string }> = {
  completeness: {
    label: '資料完整度',
    hint: '公司專頁基本資料有填的欄位數：簡介、主要產品暨服務、電話、地址、公司網址、成立日期、資本總額（共 7 項）。圖片與標籤另有各自的依據，不重複計算。',
    high: '填得越完整越前面',
    low: '填得越少越前面',
  },
  image: {
    label: '圖片',
    hint: '有沒有公司 LOGO／圖片。',
    high: '有圖片的在前',
    low: '沒有圖片的在前',
  },
  tags: {
    label: '標籤',
    hint: '企業勾選的標籤（應用情境、應用範疇、智慧技術）數量。',
    high: '標籤越多越前面',
    low: '標籤越少越前面',
  },
  matches: {
    label: '成功對接次數',
    hint: '這家供給端企業出現在幾筆需求的對接結果裡（需求端在會員中心或後台填報的「對接結果」；同一筆需求同一家只算一次）。',
    high: '對接次數越多越前面',
    low: '對接次數越少越前面',
  },
  createdTime: {
    label: '新舊',
    hint: '企業加入（建立）的時間。',
    high: '新加入的在前',
    low: '舊的在前',
  },
};

const DEFAULT_RULES: EnterpriseSortRule[] = [
  { key: 'completeness', enabled: false, descending: true },
  { key: 'image', enabled: false, descending: true },
  { key: 'tags', enabled: false, descending: true },
  { key: 'matches', enabled: false, descending: true },
  { key: 'createdTime', enabled: true, descending: true },
];

/**
 * 企業名錄排序：前台「我要媒合 → 企業名錄」列表（以及首頁「企業刊登」、全站搜尋的企業結果）的排列順序。五個排序依據（新舊、資料完整度、圖片、標籤、成功對接次數）可以各自開關、
 * 調整方向與優先順序：排在上面的先看，前面的依據分不出高下（例如兩家都有圖片）才看下一個；全部都一樣時，固定由新到舊。
 * 沒設定過＝只有「新舊（新的在前）」，跟原本相同。有自己的儲存按鈕；前台企業名錄沒有快取，儲存後重新整理就會套用。
 */
export const EnterpriseSortSection = () => {
  const notify = useNotify();
  const [rules, setRules] = useState<EnterpriseSortRule[]>(DEFAULT_RULES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    pageSettingsApi
      .getEnterpriseSort()
      .then((data) => {
        if (!cancelled && data.rules?.length) setRules(data.rules);
      })
      .catch(async () => {
        if (!cancelled) await notify.error('載入企業名錄排序設定失敗');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (index: number, patch: Partial<EnterpriseSortRule>) =>
    setRules((current) => current.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)));

  const move = (index: number, delta: -1 | 1) =>
    setRules((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await pageSettingsApi.updateEnterpriseSort({ rules });
      await notify.success('已儲存，前台企業名錄重新整理後即套用');
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

  const enabled = rules.filter((rule) => rule.enabled);
  const summary =
    enabled.length === 0
      ? '目前沒有啟用任何依據，企業會由新到舊排列。'
      : `排序方式：${enabled
          .map((rule) => `${CRITERIA[rule.key].label}（${rule.descending ? CRITERIA[rule.key].high : CRITERIA[rule.key].low}）`)
          .join(' → ')}${enabled.some((rule) => rule.key === 'createdTime') ? '' : ' → 新加入的在前'}`;

  return (
    <div className="card bg-base-100 shadow-xl">
      {notify.NotifyComponent}
      <div className="card-body space-y-4">
        <h3 className="card-title text-lg">企業名錄排序</h3>
        <p className="text-sm text-base-content/70">
          設定前台「我要媒合 → 企業名錄」列表的排列順序。勾選要使用的依據，用上下箭頭調整優先順序：排在上面的先比，
          前面的依據分不出高下時才看下一個。全部都一樣的企業，固定由新到舊。
        </p>

        <ol className="space-y-3">
          {rules.map((rule, index) => {
            const info = CRITERIA[rule.key];
            return (
              <li key={rule.key} className={`rounded-box border p-4 ${rule.enabled ? 'border-primary/40 bg-primary/5' : 'border-base-300'}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="join">
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost join-item"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label={`${info.label}提高優先順序`}
                      title="往上移（優先順序提高）"
                    >
                      <span className="iconify lucide--arrow-up size-4" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost join-item"
                      onClick={() => move(index, 1)}
                      disabled={index === rules.length - 1}
                      aria-label={`${info.label}降低優先順序`}
                      title="往下移（優先順序降低）"
                    >
                      <span className="iconify lucide--arrow-down size-4" />
                    </button>
                  </div>

                  <label className="label cursor-pointer gap-2 p-0">
                    <input
                      type="checkbox"
                      className="toggle toggle-primary toggle-sm"
                      checked={rule.enabled}
                      onChange={(e) => update(index, { enabled: e.target.checked })}
                    />
                    <span className="label-text font-medium">
                      {enabled.includes(rule) ? `${enabled.indexOf(rule) + 1}. ` : ''}
                      {info.label}
                    </span>
                  </label>

                  <select
                    className="select select-bordered select-sm ml-auto"
                    aria-label={`${info.label}排序方向`}
                    value={rule.descending ? 'high' : 'low'}
                    disabled={!rule.enabled}
                    onChange={(e) => update(index, { descending: e.target.value === 'high' })}
                  >
                    <option value="high">{info.high}</option>
                    <option value="low">{info.low}</option>
                  </select>
                </div>
                <p className="mt-2 text-xs text-base-content/60">{info.hint}</p>
              </li>
            );
          })}
        </ol>

        <p className="rounded-box bg-base-200 px-4 py-3 text-sm">{summary}</p>

        <div className="flex justify-end">
          <button type="button" className="btn btn-success" onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? <span className="loading loading-spinner loading-sm" /> : '儲存排序設定'}
          </button>
        </div>
      </div>
    </div>
  );
};
