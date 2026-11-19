import { Link } from 'react-router-dom';
import { isContentCheckActive, useContentCheckStore } from '@/stores/content-check-store';

/**
 * 鈴鐺「全部／系統」分頁最上面的「內容檢查」進度卡片：進行中顯示進度條與百分比（SignalR 即時更新），
 * 結束後顯示摘要直到使用者關閉；結果同時會在「系統」通知列表裡留一則（結束時後端寫入）。
 */
export const ContentCheckBellItem = () => {
  const job = useContentCheckStore((s) => s.job);
  const dismissed = useContentCheckStore((s) => s.dismissed);
  const dismiss = useContentCheckStore((s) => s.dismiss);

  if (!job || dismissed) return null;

  const active = isContentCheckActive(job);
  const queued = job.status === 'Queued';
  const mode = job.applyDraft ? '檢查並轉草稿' : '預覽（不動文章）';

  const failed = job.status === 'Failed';
  const cancelled = job.status === 'Cancelled';
  const icon = active ? 'lucide--loader' : failed ? 'lucide--x-circle' : job.flagged > 0 ? 'lucide--alert-triangle' : 'lucide--check-circle';
  const color = active ? 'bg-info' : failed ? 'bg-error' : job.flagged > 0 ? 'bg-warning' : 'bg-success';

  const headline = queued
    ? '內容檢查：等待開始'
    : active
      ? '內容檢查進行中'
      : failed
        ? '內容檢查中斷'
        : cancelled
          ? '內容檢查已取消'
          : job.flagged === 0
            ? '內容檢查完成：沒有發現問題'
            : `內容檢查完成：${job.flagged} 篇有問題`;

  return (
    <>
      <div className="relative flex items-start gap-3 p-4" role="status" aria-live="polite">
        <div className="avatar size-12">
          <div className={`mask mask-squircle flex items-center justify-center ${color}`}>
            <span className={`iconify ${icon} size-6 text-white ${active && !queued ? 'animate-spin' : ''}`} />
          </div>
        </div>

        <div className="grow min-w-0">
          <p className="text-sm leading-tight font-medium">{headline}</p>
          <p className="text-base-content/60 text-xs">{mode}</p>

          {queued ? (
            <p className="text-base-content/70 mt-1 text-xs">已排入佇列，背景服務很快會開始。</p>
          ) : (
            <p className="text-base-content/70 mt-1 text-xs">
              已檢查 {job.checked} / {job.total} 篇
              {job.flagged > 0 ? `，有問題 ${job.flagged} 篇` : ''}
              {job.applyDraft && job.drafted > 0 ? `，已轉草稿 ${job.drafted} 篇` : ''}
            </p>
          )}

          {active && !queued && (
            <div className="mt-2">
              <progress className="progress progress-info h-1.5 w-full" value={job.percent} max={100} aria-label="內容檢查進度" />
              <div className="text-base-content/60 mt-0.5 text-right text-[10px]">{job.percent}%</div>
            </div>
          )}

          {job.error && <p className="text-error mt-1 text-xs">{job.error}</p>}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Link to="/system/config?tab=contentCheck" className="btn btn-xs btn-primary" onClick={() => { if (!active) dismiss(); }}>
              查看詳情
            </Link>
            {!active && (
              <button type="button" className="btn btn-xs btn-ghost" onClick={dismiss}>
                關閉
              </button>
            )}
          </div>
        </div>
      </div>
      <hr className="border-base-300 border-dashed" />
    </>
  );
};
