import { useEffect, useRef, useState } from 'react';
import { demandsApi } from '@/lib/api/demands';
import type { DemandNotificationRecord } from '@/types/demand';

const STATUS_LABELS = ['待寄送', '已寄送', '寄送失敗'] as const;
const STATUS_ICONS = [
  <span key="p" className="loading loading-spinner loading-xs" />,
  <span key="s" className="iconify lucide--check size-4 text-success" />,
  <span key="f" className="iconify lucide--x size-4 text-error" />,
] as const;

interface Props {
  open: boolean;
  demandId: string;
  onClose: () => void;
}

export const DemandNotificationProgressModal = ({ open, demandId, onClose }: Props) => {
  const [records, setRecords] = useState<DemandNotificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRecords = async () => {
    try {
      const data = await demandsApi.getNotifications(demandId);
      setRecords(data);
      setIsLoading(false);

      const allDone = data.length > 0 && data.every((r) => r.status !== 0);
      if (allDone && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } catch {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    setRecords([]);

    // 初次略等 0.5s 讓後端建好 Pending 紀錄
    const initial = setTimeout(() => {
      void fetchRecords();
      timerRef.current = setInterval(() => void fetchRecords(), 2000);
    }, 500);

    return () => {
      clearTimeout(initial);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, demandId]);

  const allDone = records.length > 0 && records.every((r) => r.status !== 0);
  const sentCount = records.filter((r) => r.status === 1).length;
  const failedCount = records.filter((r) => r.status === 2).length;

  if (!open) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-lg w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="iconify lucide--send size-5" />
            通知寄送進度
          </h3>
          {allDone && (
            <button type="button" className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
              <span className="iconify lucide--x size-4" />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : records.length === 0 ? (
          <div className="py-10 text-center text-base-content/60">
            <span className="iconify lucide--mail-x size-10 mx-auto mb-2 block" />
            <p className="text-sm">本次發布無需通知的業者</p>
            <p className="text-xs mt-1">（無標籤相符業者，或已全部取消勾選）</p>
          </div>
        ) : (
          <>
            <div className="mb-3 text-sm text-base-content/70 flex items-center gap-3">
              <span>共 {records.length} 位收件者</span>
              {allDone && (
                <>
                  <span className="text-success">✓ {sentCount} 封已送出</span>
                  {failedCount > 0 && <span className="text-error">✗ {failedCount} 封失敗</span>}
                </>
              )}
            </div>

            <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {records.map((r) => (
                <li key={r.id} className="flex items-center gap-3 rounded-lg border border-base-200 px-3 py-2.5">
                  <div className="shrink-0 w-5 flex justify-center">
                    {STATUS_ICONS[r.status]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {r.companyName ?? r.recipientEmail}
                    </div>
                    <div className="text-xs text-base-content/50 truncate">{r.recipientEmail}</div>
                    {r.errorMessage && (
                      <div className="text-xs text-error mt-0.5 truncate">{r.errorMessage}</div>
                    )}
                  </div>
                  <span className={`text-xs shrink-0 ${r.status === 1 ? 'text-success' : r.status === 2 ? 'text-error' : 'text-base-content/50'}`}>
                    {STATUS_LABELS[r.status]}
                  </span>
                </li>
              ))}
            </ul>

            {!allDone && (
              <p className="mt-3 text-xs text-center text-base-content/50">
                寄送中，每 2 秒自動更新…
              </p>
            )}
          </>
        )}

        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>
            {allDone || records.length === 0 ? '關閉' : '背景執行'}
          </button>
        </div>
      </div>
      {(allDone || records.length === 0) && <div className="modal-backdrop" onClick={onClose} />}
    </dialog>
  );
};
