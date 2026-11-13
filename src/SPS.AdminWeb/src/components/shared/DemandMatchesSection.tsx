import { useEffect, useState } from 'react';
import { demandsApi } from '@/lib/api/demands';
import type { DemandMatchCompany, MatchCompanyOption } from '@/types/demand';
import { useNotify } from '@/hooks/useNotify';

const MAX_COMPANIES = 20;

/**
 * 需求的「對接結果」（issue #98）：這筆需求成功對接到哪些供給端企業（可以多家）。有任何一家＝前台顯示「已成功對接」，
 * 全部移除＝回到「徵求中」。前台公開頁只顯示狀態、不公開是哪幾家；刊登端（會員中心）與這裡看得到。
 * 前台會員填報不需要審核，所以這裡可以查看每家是誰、什麼時候填的，並撤銷（把它移除後儲存）。
 * 有自己的儲存按鈕（不跟需求表單的「儲存為草稿／立即發布」綁在一起）。
 */
export const DemandMatchesSection = ({
  demandId,
  initial,
  onChanged,
}: {
  demandId: string;
  initial: DemandMatchCompany[];
  /** 儲存後通知外層（需要的話更新狀態） */
  onChanged?: (companies: DemandMatchCompany[]) => void;
}) => {
  const notify = useNotify();
  const [saved, setSaved] = useState<DemandMatchCompany[]>(initial);
  const [selected, setSelected] = useState<{ id: string; name: string }[]>(initial.map((c) => ({ id: c.companyId, name: c.companyName })));
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<MatchCompanyOption[]>([]);
  // 選項是針對哪個關鍵字查的；跟目前輸入的不同就是還在搜尋中（不需要在 effect 裡同步設狀態）
  const [searchedFor, setSearchedFor] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const searching = searchedFor !== search.trim();

  // 需求表單載入完成後才會渲染這個元件（見 DemandFormPage 的 isLoading），初始值在第一次渲染就是完整的

  useEffect(() => {
    let active = true;
    const keyword = search.trim();
    const timer = window.setTimeout(() => {
      demandsApi
        .searchMatchCompanies(keyword)
        .then((rows) => {
          if (!active) return;
          setOptions(rows);
          setSearchedFor(keyword);
        })
        .catch(() => {
          if (!active) return;
          setOptions([]);
          setSearchedFor(keyword);
        });
    }, 300);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [search]);

  const available = options.filter((o) => !selected.some((s) => s.id === o.id));
  const dirty =
    selected.length !== saved.length || selected.some((s) => !saved.some((c) => c.companyId === s.id));

  const add = (option: MatchCompanyOption) => {
    if (selected.length >= MAX_COMPANIES) {
      void notify.warning(`最多填報 ${MAX_COMPANIES} 家對接企業`);
      return;
    }
    setSelected((prev) => [...prev, { id: option.id, name: option.name }]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await demandsApi.setDemandMatches(demandId, selected.map((s) => s.id));
      setSaved(result.companies);
      setSelected(result.companies.map((c) => ({ id: c.companyId, name: c.companyName })));
      onChanged?.(result.companies);
      await notify.success(result.matched ? '已儲存，這筆需求在前台顯示為「已成功對接」' : '已移除全部對接結果，這筆需求回到「徵求中」');
    } catch (error) {
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      await notify.error(message || '儲存對接結果失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('zh-TW', { hour12: false });
  };

  return (
    <div className="rounded-box border border-base-300 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="font-semibold flex items-center gap-2">
            <span className="iconify lucide--handshake size-5" />
            對接結果
            <span className={`badge badge-sm ${saved.length > 0 ? 'badge-success' : 'badge-ghost'}`}>{saved.length > 0 ? '已成功對接' : '徵求中'}</span>
          </h4>
          <p className="text-sm text-base-content/60">
            成功對接到哪些供給端企業（可多家）。前台只顯示「已成功對接」狀態、不公開是哪幾家；會員在會員中心填報的也會出現在這裡，可以撤銷。
          </p>
        </div>
        <button type="button" className="btn btn-success btn-sm" onClick={handleSave} disabled={isSaving || !dirty}>
          {isSaving ? <span className="loading loading-spinner loading-xs" /> : <span className="iconify lucide--save size-4" />}
          儲存對接結果
        </button>
      </div>

      {selected.length === 0 ? (
        <div className="text-sm text-base-content/60">還沒有對接結果。</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>對接企業</th>
                <th>填報者</th>
                <th>填報時間</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {selected.map((s) => {
                const info = saved.find((c) => c.companyId === s.id);
                return (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td className="text-sm">{info ? info.reportedBy ?? '' : <span className="text-warning">尚未儲存</span>}</td>
                    <td className="text-sm">{info ? formatTime(info.reportedTime) : ''}</td>
                    <td className="text-right">
                      <button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => setSelected((prev) => prev.filter((p) => p.id !== s.id))} disabled={isSaving}>
                        移除
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="form-control">
        <label className="label">
          <span className="label-text">新增對接企業（搜尋供給端企業名稱或編號）</span>
        </label>
        <input type="search" className="input input-bordered" maxLength={50} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="輸入企業名稱關鍵字" />
      </div>
      <div className="border border-base-300 rounded-box max-h-56 overflow-y-auto">
        {searching && available.length === 0 ? (
          <div className="p-3 text-sm text-base-content/60">搜尋中…</div>
        ) : available.length === 0 ? (
          <div className="p-3 text-sm text-base-content/60">沒有符合的企業</div>
        ) : (
          <ul>
            {available.map((o) => (
              <li key={o.id} className="flex items-center justify-between px-3 py-1.5 border-b border-base-200 last:border-b-0">
                <span className="text-sm">
                  {o.name}
                  {o.number && <span className="ml-2 text-base-content/50">{o.number}</span>}
                </span>
                <button type="button" className="btn btn-outline btn-xs" onClick={() => add(o)} disabled={isSaving || selected.length >= MAX_COMPANIES}>
                  加入
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
