import { useEffect, useMemo, useState } from 'react';
import { companiesApi } from '@/lib/api/companies';
import { mailCampaignsApi } from '@/lib/api/mailCampaigns';
import type { Company } from '@/types/company';
import { Status, CompanyType, CompanyLevel } from '@/types/company';
import type { CampaignRecipientFilter } from '@/types/mailCampaign';

const COMPANY_TYPE_LABEL: Record<number, string> = {
  [CompanyType.Supplier]: '供應商',
  [CompanyType.Buyer]: '需求方',
  [CompanyType.Both]: '雙向',
};
const COMPANY_LEVEL_LABEL: Record<number, string> = {
  [CompanyLevel.Regular]: '一般',
  [CompanyLevel.Silver]: '銀',
  [CompanyLevel.Gold]: '金',
  [CompanyLevel.Diamond]: '鑽石',
};

type Mode = 'companies' | 'broadcast';

type Props = {
  open: boolean;
  initialMode?: Mode;
  initialCompanies: Company[];
  initialFilter?: CampaignRecipientFilter;
  onConfirm: (
    mode: Mode,
    companies: Company[],
    filter: CampaignRecipientFilter | undefined
  ) => void;
  onClose: () => void;
};

export const RecipientPickerDialog = ({
  open,
  initialMode = 'companies',
  initialCompanies,
  initialFilter,
  onConfirm,
  onClose,
}: Props) => {
  // 本地副本：只在按下「套用」時回拋
  const [mode, setMode] = useState<Mode>(initialMode);
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [companyTypes, setCompanyTypes] = useState<number[]>(initialFilter?.companyTypes ?? []);
  const [companyLevels, setCompanyLevels] = useState<number[]>(initialFilter?.companyLevels ?? []);
  const [memberStatus, setMemberStatus] = useState<number>(initialFilter?.memberStatus ?? Status.Active);

  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const companyIds = useMemo(() => companies.map((c) => c.id), [companies]);

  const draftFilter: CampaignRecipientFilter | undefined = useMemo(() => {
    const f: CampaignRecipientFilter = {};
    if (companyTypes.length > 0) f.companyTypes = companyTypes;
    if (companyLevels.length > 0) f.companyLevels = companyLevels;
    if (memberStatus !== Status.Active) f.memberStatus = memberStatus;
    return Object.keys(f).length > 0 ? f : undefined;
  }, [companyTypes, companyLevels, memberStatus]);

  // 對話框開啟時把外部最新狀態同步進來
  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    setCompanies(initialCompanies);
    setCompanyTypes(initialFilter?.companyTypes ?? []);
    setCompanyLevels(initialFilter?.companyLevels ?? []);
    setMemberStatus(initialFilter?.memberStatus ?? Status.Active);
    setSearch('');
    setSearchResults([]);
  }, [open, initialMode, initialCompanies, initialFilter]);

  // 公司搜尋 debounced
  useEffect(() => {
    if (!open) return;
    const k = search.trim();
    if (!k) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await companiesApi.getCompanies(1, 20, {
          search: k,
          status: Status.Active,
        });
        setSearchResults(res.items ?? []);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search, open]);

  // 預覽人數
  useEffect(() => {
    if (!open) return;
    if (mode === 'companies' && companyIds.length === 0) {
      setRecipientCount(null);
      return;
    }
    const t = setTimeout(async () => {
      setIsPreviewing(true);
      try {
        const { count } = await mailCampaignsApi.previewRecipientCount({
          companyIds: mode === 'companies' ? companyIds : [],
          filter: draftFilter,
          broadcast: mode === 'broadcast',
        });
        setRecipientCount(count);
      } catch {
        setRecipientCount(null);
      } finally {
        setIsPreviewing(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [mode, companyIds, draftFilter, open]);

  const addCompany = (c: Company) => {
    setCompanies((prev) => (prev.some((x) => x.id === c.id) ? prev : [...prev, c]));
    setSearch('');
    setSearchResults([]);
  };
  const removeCompany = (id: string) => {
    setCompanies((prev) => prev.filter((c) => c.id !== id));
  };
  const toggle = (arr: number[], v: number) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const handleApply = () => {
    onConfirm(mode, mode === 'companies' ? companies : [], draftFilter);
  };

  const isCompaniesDisabled = mode === 'broadcast';

  return (
    <dialog className={`modal ${open ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-3xl">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          <span className="iconify lucide--x size-5" />
        </button>

        <h3 className="font-bold text-lg mb-4">
          <span className="iconify lucide--users size-5 inline-block mr-1" />
          選擇收件對象
        </h3>

        <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
          {/* 模式切換 */}
          <section>
            <h4 className="font-semibold mb-2 text-sm">收件範圍</h4>
            <div className="flex flex-col gap-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  className="radio radio-sm mt-0.5"
                  checked={mode === 'companies'}
                  onChange={() => setMode('companies')}
                />
                <div>
                  <div className="font-medium text-sm">指定公司</div>
                  <div className="text-xs text-base-content/60">寄給下方挑選的公司底下會員（可再用篩選縮窄）</div>
                </div>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  className="radio radio-sm mt-0.5"
                  checked={mode === 'broadcast'}
                  onChange={() => setMode('broadcast')}
                />
                <div>
                  <div className="font-medium text-sm">
                    全部會員（廣播）
                    <span className="badge badge-warning badge-xs ml-2 align-middle">高影響</span>
                  </div>
                  <div className="text-xs text-base-content/60">
                    不限公司，寄給所有 Active 會員。可搭配下方進階篩選縮窄（例：類型=供應商 → 全部供給端會員）
                  </div>
                </div>
              </label>
            </div>
          </section>

          {/* 公司選擇 */}
          <section className={`border-t pt-4 ${isCompaniesDisabled ? 'opacity-50' : ''}`}>
            <h4 className="font-semibold mb-2 text-sm">
              <span className="iconify lucide--building-2 size-4 inline-block mr-1" />
              公司（{companies.length}）
              {isCompaniesDisabled && (
                <span className="text-xs text-base-content/60 ml-2 font-normal">廣播模式下忽略</span>
              )}
            </h4>

            {companies.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {companies.map((c) => (
                  <span key={c.id} className="badge badge-primary gap-2">
                    {c.name}
                    <button
                      type="button"
                      className="cursor-pointer"
                      onClick={() => removeCompany(c.id)}
                      title="移除"
                      disabled={isCompaniesDisabled}
                    >
                      <span className="iconify lucide--x size-3" />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => setCompanies([])}
                  disabled={isCompaniesDisabled}
                >
                  全部清除
                </button>
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                className="input input-bordered input-sm w-full"
                placeholder="搜尋公司名稱、英文名或統一編號..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={isCompaniesDisabled}
              />
              {searchResults.length > 0 && !isCompaniesDisabled && (
                <div className="absolute z-10 mt-1 w-full max-h-64 overflow-y-auto rounded border bg-base-100 shadow">
                  {searchResults.map((c) => {
                    const already = companies.some((x) => x.id === c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className={`block w-full px-3 py-2 text-left text-sm hover:bg-base-200 ${
                          already ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={already}
                        onClick={() => addCompany(c)}
                      >
                        <span className="font-medium">{c.name}</span>
                        {c.englishName && (
                          <span className="text-base-content/60 ml-2">{c.englishName}</span>
                        )}
                        {already && <span className="text-xs text-base-content/50 ml-2">（已加入）</span>}
                      </button>
                    );
                  })}
                </div>
              )}
              {isSearching && (
                <div className="absolute right-2 top-2">
                  <span className="loading loading-spinner loading-xs" />
                </div>
              )}
            </div>
          </section>

          {/* 進階篩選 */}
          <section className="border-t pt-4">
            <h4 className="font-semibold mb-3 text-sm">
              <span className="iconify lucide--sliders-horizontal size-4 inline-block mr-1" />
              進階篩選
            </h4>

            <div className="space-y-3">
              <div>
                <div className="text-xs text-base-content/60 mb-1">公司類型</div>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(COMPANY_TYPE_LABEL).map(([k, label]) => (
                    <label key={k} className="cursor-pointer label gap-1 p-0">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-xs"
                        checked={companyTypes.includes(Number(k))}
                        onChange={() => setCompanyTypes((prev) => toggle(prev, Number(k)))}
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs text-base-content/60 mb-1">公司級別</div>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(COMPANY_LEVEL_LABEL).map(([k, label]) => (
                    <label key={k} className="cursor-pointer label gap-1 p-0">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-xs"
                        checked={companyLevels.includes(Number(k))}
                        onChange={() => setCompanyLevels((prev) => toggle(prev, Number(k)))}
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs text-base-content/60 mb-1">會員狀態</div>
                <select
                  className="select select-bordered select-xs"
                  value={memberStatus}
                  onChange={(e) => setMemberStatus(Number(e.target.value))}
                >
                  <option value={Status.Active}>啟用中</option>
                  <option value={Status.Inactive}>停用</option>
                </select>
              </div>
            </div>
          </section>
        </div>

        {/* 即時人數 + 操作 */}
        <div className="modal-action items-center justify-between border-t pt-3 mt-4">
          <div className="text-sm">
            {mode === 'companies' && companies.length === 0 ? (
              <span className="text-base-content/60">尚未選擇公司</span>
            ) : isPreviewing ? (
              <span className="text-base-content/60">計算中...</span>
            ) : recipientCount !== null ? (
              <span>
                目前將寄給 <span className="font-semibold">{recipientCount}</span> 位收件人
                {mode === 'broadcast' && (
                  <span className="text-warning ml-2">（廣播）</span>
                )}
              </span>
            ) : null}
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              取消
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleApply}
              disabled={mode === 'companies' && companies.length === 0}
            >
              套用
            </button>
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};
