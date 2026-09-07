import { useEffect, useState } from 'react';
import { protrackApi } from '@/lib/api/protrack';
import type { ProTrackSubmissionItem, ProTrackImportResult } from '@/types/protrack';

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (result: ProTrackImportResult) => void;
}

function formatDateTime(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('zh-TW', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export const ProTrackImportModal = ({ open, onClose, onImport }: Props) => {
  const [submissions, setSubmissions] = useState<ProTrackSubmissionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setError(null);
    setIsLoading(true);
    protrackApi
      .getSubmissions()
      .then(setSubmissions)
      .catch((e: { response?: { data?: { error?: string } } }) =>
        setError(e?.response?.data?.error ?? '載入失敗，請確認訂閱設定是否正確')
      )
      .finally(() => setIsLoading(false));
  }, [open]);

  const handleSelect = async (item: ProTrackSubmissionItem) => {
    setIsParsing(item.id);
    try {
      const result = await protrackApi.parseSubmission(item.id);
      onImport(result);
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error ?? '解析失敗');
    } finally {
      setIsParsing(null);
    }
  };

  const filtered = search.trim()
    ? submissions.filter(
        (s) =>
          s.companyName.includes(search) ||
          s.consultant.includes(search) ||
          s.submittedBy.includes(search) ||
          s.summary.includes(search)
      )
    : submissions;

  if (!open) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={onClose}>
          ✕
        </button>

        <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
          <span className="iconify lucide--file-input size-5 text-info" />
          導入需求
        </h3>
        <p className="text-sm text-base-content/60 mb-4">
          選擇 ProTrack 評估表單記錄，自動帶入需求名稱與介紹
        </p>

        {error && (
          <div className="alert alert-error mb-4">
            <span className="iconify lucide--alert-circle size-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <input
          type="text"
          className="input input-bordered input-sm w-full mb-3"
          placeholder="搜尋廠商名稱、顧問或填表人..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="overflow-y-auto max-h-[440px] space-y-2 pr-0.5">
          {isLoading ? (
            <div className="flex justify-center py-14">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-base-content/50 py-14 text-sm">
              沒有符合的表單記錄
            </p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                className="w-full text-left border border-base-300 rounded-xl p-4 hover:border-info hover:bg-info/5 transition-colors group disabled:opacity-60"
                onClick={() => handleSelect(item)}
                disabled={isParsing === item.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* 廠商名稱 */}
                    <p className="font-semibold text-base truncate group-hover:text-info transition-colors">
                      {item.companyName || '（未知廠商）'}
                    </p>

                    {/* 說明（建議項目） */}
                    {item.summary && (
                      <p className="text-sm text-base-content/70 mt-1.5 line-clamp-2 leading-relaxed">
                        {item.summary}
                        {item.recommendationCount > 1 && (
                          <span className="ml-1 text-xs text-base-content/40">
                            （共 {item.recommendationCount} 項）
                          </span>
                        )}
                      </p>
                    )}

                    {/* 後設資訊列 */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-xs text-base-content/50">
                      {item.date && (
                        <span className="flex items-center gap-1">
                          <span className="iconify lucide--calendar size-3" />
                          評估日期：{item.date}
                        </span>
                      )}
                      {item.consultant && (
                        <span className="flex items-center gap-1">
                          <span className="iconify lucide--user-check size-3" />
                          顧問：{item.consultant}
                        </span>
                      )}
                      {item.submittedAt && (
                        <span className="flex items-center gap-1">
                          <span className="iconify lucide--clock size-3" />
                          提交時間：{formatDateTime(item.submittedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 mt-1">
                    {isParsing === item.id ? (
                      <span className="loading loading-spinner loading-sm text-info" />
                    ) : (
                      <span className="iconify lucide--chevron-right size-5 text-base-content/30 group-hover:text-info transition-colors" />
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="modal-action mt-4">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            取消
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
};
