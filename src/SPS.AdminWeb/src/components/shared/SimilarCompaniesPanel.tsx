import { useEffect, useMemo, useState } from 'react';
import { similarCompaniesApi } from '@/lib/api/protrack';
import type { SimilarCompanyResult, SimilarCompanyByVectorResult } from '@/types/protrack';

interface Props {
  tagIds: number[];
  /** 已儲存需求的 ID。有值時 AI 建議會在需求內容/標籤變動時自動重新查詢（讀已索引資料）。 */
  demandId?: string;
  /** 新增需求（尚未儲存、沒有 demandId）時，「AI 推薦」按鈕要送出的當下輸入內容。
   *  這是即時查詢，不寫入索引，跟 demandId 版本的自動查詢是兩條不同路徑。 */
  previewName?: string;
  previewIntroduction?: string;
  onSelectionChange?: (companyIds: string[]) => void;
}

// 候選卡片：標籤比對來源與 AI 語意搜尋來源合併後的統一資料結構（見 docs/設計/AI向量媒合搜尋設計.md §9.2）
interface MergedCandidate {
  companyId: string;
  companyName: string;
  chargeEmail?: string;
  tagResult?: SimilarCompanyResult;
  aiRank?: number; // 1-based，越小越相關；undefined 代表這家業者沒有被 AI 語意搜尋命中
}

const AI_TOP_N_FOR_TIER = 20; // 對齊後端 GetSimilarCompaniesByVectorAsync 的預設 topN，用於分級門檻計算

function aiTier(rank: number): { label: string; badgeClass: string } {
  if (rank <= AI_TOP_N_FOR_TIER / 3) return { label: '高', badgeClass: 'badge-success' };
  if (rank <= (AI_TOP_N_FOR_TIER / 3) * 2) return { label: '中', badgeClass: 'badge-warning' };
  return { label: '低', badgeClass: 'badge-neutral' };
}

export const SimilarCompaniesPanel = ({ tagIds, demandId, previewName, previewIntroduction, onSelectionChange }: Props) => {
  const [companies, setCompanies] = useState<SimilarCompanyResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threshold, setThreshold] = useState(30);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  const [aiResults, setAiResults] = useState<SimilarCompanyByVectorResult[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [sortBy, setSortBy] = useState<'tag' | 'ai'>('tag');

  const tagKey = useMemo(() => [...tagIds].sort().join(','), [tagIds]);

  useEffect(() => {
    if (tagIds.length === 0) {
      setCompanies([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    similarCompaniesApi
      .getSimilarCompanies(tagIds)
      .then((data) => {
        if (cancelled) return;
        setCompanies(data);
        setExcludedIds(new Set());
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagKey]);

  // AI 語意搜尋（已儲存需求）：內容/標籤變動時自動重新查詢，獨立的 loading 狀態，
  // 不卡住標籤比對結果先顯示（§9.3 第 5 點）
  useEffect(() => {
    if (!demandId) {
      setAiResults([]);
      setAiUnavailable(false);
      return;
    }

    let cancelled = false;
    setIsAiLoading(true);
    setAiUnavailable(false);

    similarCompaniesApi
      .getSimilarCompaniesByVector(demandId)
      .then((data) => {
        if (cancelled) return;
        setAiResults(data);
      })
      .catch(() => {
        // AI 服務未啟用/未設定/暫時不可用——不阻擋標籤比對清單正常運作（§9.3 第 6 點）
        if (!cancelled) {
          setAiResults([]);
          setAiUnavailable(true);
        }
      })
      .finally(() => { if (!cancelled) setIsAiLoading(false); });

    return () => { cancelled = true; };
  }, [demandId]);

  // AI 語意搜尋（尚未儲存的新增需求）：手動觸發，不隨每次打字自動查詢，避免過多 API 呼叫
  const handlePreviewAi = async () => {
    setIsAiLoading(true);
    setAiUnavailable(false);
    try {
      const data = await similarCompaniesApi.previewSimilarCompaniesByVector({
        name: previewName,
        introduction: previewIntroduction,
        tagIds,
      });
      setAiResults(data);
    } catch {
      setAiResults([]);
      setAiUnavailable(true);
    } finally {
      setIsAiLoading(false);
    }
  };

  // 候選集合 = 標籤候選 ∪ AI 候選（聯集），不是只在標籤候選上加註 AI 分數（§9.2 Q2）
  const merged = useMemo<MergedCandidate[]>(() => {
    const byId = new Map<string, MergedCandidate>();

    for (const c of companies) {
      byId.set(c.companyId, { companyId: c.companyId, companyName: c.companyName, chargeEmail: c.chargeEmail, tagResult: c });
    }
    for (const a of aiResults) {
      const existing = byId.get(a.companyId);
      if (existing) {
        existing.aiRank = a.rank;
      } else {
        byId.set(a.companyId, { companyId: a.companyId, companyName: a.companyName, chargeEmail: a.chargeEmail, aiRank: a.rank });
      }
    }
    return Array.from(byId.values());
  }, [companies, aiResults]);

  const visible = merged.filter((c) => (c.tagResult ? c.tagResult.overlapPercent >= threshold : true));
  const sorted = useMemo(() => {
    const list = [...visible];
    if (sortBy === 'ai') {
      list.sort((a, b) => (a.aiRank ?? Infinity) - (b.aiRank ?? Infinity));
    } else {
      list.sort((a, b) => (b.tagResult?.overlapPercent ?? -1) - (a.tagResult?.overlapPercent ?? -1));
    }
    return list;
  }, [visible, sortBy]);

  const selectedVisible = sorted.filter((c) => !excludedIds.has(c.companyId));

  useEffect(() => {
    onSelectionChange?.(selectedVisible.map((c) => c.companyId));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merged, threshold, excludedIds, sortBy]);

  // 沒有標籤時，只有在「新增需求且已輸入名稱/介紹（AI 推薦按鈕可用）」的情況下才需要顯示面板；
  // 已儲存需求（demandId 存在）一律顯示，讓 AI 建議能自動查詢
  const hasPreviewableText = !!previewName?.trim() || !!previewIntroduction?.trim();
  if (tagIds.length === 0 && !demandId && !hasPreviewableText) return null;

  const toggleCompany = (companyId: string) => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(companyId)) next.delete(companyId);
      else next.add(companyId);
      return next;
    });
  };

  const allSelected = sorted.length > 0 && selectedVisible.length === sorted.length;

  const toggleAll = () => {
    if (allSelected) {
      setExcludedIds(new Set(sorted.map((c) => c.companyId)));
    } else {
      setExcludedIds((prev) => {
        const next = new Set(prev);
        sorted.forEach((c) => next.delete(c.companyId));
        return next;
      });
    }
  };

  return (
    <div className="card bg-base-200 border border-base-300">
      <div className="card-body py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h4 className="font-semibold flex items-center gap-2 text-sm">
            <span className="iconify lucide--building-2 size-4" />
            匹配供給端業者
            {!isLoading && (
              <span className="badge badge-neutral badge-sm">{sorted.length}</span>
            )}
            {!isLoading && sorted.length > 0 && (
              <span className="badge badge-primary badge-sm">已選 {selectedVisible.length}</span>
            )}
            {demandId && (
              <div className="tooltip tooltip-bottom" data-tip="依測試資料，正確業者有 75% 機率出現在 AI 建議清單前 10 名內（非精準排序，僅供參考，仍需人工複核）">
                <span className="iconify lucide--sparkles size-4 text-primary" />
              </div>
            )}
          </h4>
          <div className="flex items-center gap-3 flex-wrap">
            {!demandId && (
              <button
                type="button"
                className="btn btn-outline btn-primary btn-xs gap-1.5"
                onClick={handlePreviewAi}
                disabled={isAiLoading || (!previewName?.trim() && !previewIntroduction?.trim() && tagIds.length === 0)}
              >
                {isAiLoading ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <span className="iconify lucide--sparkles size-3.5" />
                )}
                AI 推薦
              </button>
            )}
            {demandId && aiResults.length > 0 && (
              <div className="join">
                <button
                  type="button"
                  className={`btn btn-xs join-item ${sortBy === 'tag' ? 'btn-active' : ''}`}
                  onClick={() => setSortBy('tag')}
                >
                  依標籤排序
                </button>
                <button
                  type="button"
                  className={`btn btn-xs join-item ${sortBy === 'ai' ? 'btn-active' : ''}`}
                  onClick={() => setSortBy('ai')}
                >
                  依 AI 相關度排序
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-base-content/60 whitespace-nowrap">推薦門檻</span>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="range range-primary range-xs w-28"
              />
              <span className="font-mono font-semibold w-10 text-right text-primary">{threshold}%</span>
            </div>
          </div>
        </div>

        {isAiLoading && (
          <p className="text-xs text-base-content/50 mt-1 flex items-center gap-1.5">
            <span className="loading loading-spinner loading-xs" />
            AI 語意搜尋比對中…
          </p>
        )}
        {aiUnavailable && (
          <p className="text-xs text-base-content/40 mt-1">AI 建議暫不可用（服務未啟用或未設定），僅顯示標籤比對結果</p>
        )}

        {isLoading ? (
          <div className="flex justify-center py-6">
            <span className="loading loading-spinner loading-md" />
          </div>
        ) : sorted.length === 0 ? (
          <p className="text-center text-base-content/50 text-sm py-4">
            {merged.length === 0 ? '尚無供給端業者綁定標籤' : `無業者達到 ${threshold}% 門檻，可降低門檻查看更多`}
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between mt-1 mb-1">
              <p className="text-xs text-base-content/50">
                取消勾選可排除該業者，不會收到本次發布的媒合通知信
              </p>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={toggleAll}
              >
                {allSelected ? '取消全選' : '全選'}
              </button>
            </div>
            <div className="space-y-2">
              {sorted.map((c) => {
                const checked = !excludedIds.has(c.companyId);
                const isAiOnly = !c.tagResult && c.aiRank != null;
                return (
                  <label
                    key={c.companyId}
                    className={`flex items-start gap-3 bg-base-100 rounded-lg p-3 cursor-pointer transition-opacity ${checked ? '' : 'opacity-50'}`}
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm mt-0.5"
                      checked={checked}
                      onChange={() => toggleCompany(c.companyId)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{c.companyName}</span>
                        {c.chargeEmail && (
                          <span className="text-xs text-base-content/50 truncate">{c.chargeEmail}</span>
                        )}
                        {isAiOnly && (
                          <span className="badge badge-info badge-outline badge-xs">AI 新發現</span>
                        )}
                      </div>
                      {c.tagResult ? (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {c.tagResult.matchedTagNames.map((tag) => (
                            <span key={tag} className="badge badge-primary badge-outline badge-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-base-content/40 mt-1">無標籤命中，建議人工確認相關性</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right space-y-1">
                      {c.tagResult && (
                        <div>
                          <OverlapBadge percent={c.tagResult.overlapPercent} />
                          <p className="text-xs text-base-content/50 mt-0.5">
                            {c.tagResult.matchCount}/{c.tagResult.demandTagCount} 標籤
                          </p>
                        </div>
                      )}
                      {c.aiRank != null && (
                        <AiRelevanceBadge rank={c.aiRank} />
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const OverlapBadge = ({ percent }: { percent: number }) => {
  const color = percent >= 80 ? 'badge-success' : percent >= 50 ? 'badge-warning' : 'badge-neutral';
  return <span className={`badge ${color} badge-sm font-mono`}>{percent}%</span>;
};

const AiRelevanceBadge = ({ rank }: { rank: number }) => {
  const tier = aiTier(rank);
  return (
    <span className={`badge ${tier.badgeClass} badge-sm gap-1`}>
      <span className="iconify lucide--sparkles size-3" />
      AI {tier.label}
    </span>
  );
};
