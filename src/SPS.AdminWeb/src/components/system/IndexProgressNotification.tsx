import { Link } from 'react-router-dom';
import { useIndexProgressStore } from '@/stores/index-progress-store';

/**
 * 右下角通知：背景索引（AI 向量索引 + 內容檢查）進度百分比。
 * 內容檢查發現問題的文章會被自動轉成草稿，結束時摘要會告訴你有幾篇，原因寫在各文章編輯頁。
 */
export const IndexProgressNotification = () => {
  const run = useIndexProgressStore((s) => s.run);
  const dismissed = useIndexProgressStore((s) => s.dismissed);
  const dismiss = useIndexProgressStore((s) => s.dismiss);

  if (!run || dismissed) return null;

  const { job, finished } = run;
  const total = job.reindexTotal;
  const processed = job.reindexProcessed;
  const queued = job.reindexQueued && job.phase !== 'reindexing';
  const pct = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;

  let tone: 'info' | 'success' | 'warning' | 'error' = 'info';
  let headline = '索引與內容檢查進行中';
  if (queued) headline = '索引與內容檢查：等待開始';
  if (finished) {
    if (job.lastError) {
      tone = 'error';
      headline = '索引與內容檢查中斷';
    } else if (job.reindexDrafted > 0 || job.reindexFailed > 0) {
      tone = 'warning';
      headline = '索引與內容檢查完成（有需要處理的項目）';
    } else {
      tone = 'success';
      headline = '索引與內容檢查完成';
    }
  }

  const toneClass = {
    info: 'border-info/40',
    success: 'border-success/40',
    warning: 'border-warning/40',
    error: 'border-error/40',
  }[tone];
  const toneText = { info: 'text-info', success: 'text-success', warning: 'text-warning', error: 'text-error' }[tone];
  const icon = { info: 'lucide--loader', success: 'lucide--check-circle', warning: 'lucide--alert-triangle', error: 'lucide--x-circle' }[tone];

  return (
    <div className="fixed bottom-24 right-4 z-50 w-80 max-w-[calc(100vw-2rem)]" role="status" aria-live="polite">
      <div className={`relative overflow-hidden rounded-lg border ${toneClass} bg-base-100 p-3 text-sm shadow-md`}>
        <div className="flex items-start gap-2">
          <span className={`iconify ${icon} mt-0.5 size-5 shrink-0 ${toneText} ${!finished && !queued ? 'animate-spin' : ''}`} />
          <div className="min-w-0 grow">
            <div className="font-semibold">{headline}</div>

            {queued ? (
              <div className="text-xs text-base-content/70">已排入佇列，背景服務很快會開始。</div>
            ) : (
              <>
                <div className="text-xs text-base-content/70">
                  已處理 {processed} / {total} 筆
                  {job.reindexFailed > 0 ? `（失敗 ${job.reindexFailed}）` : ''}
                </div>
                {!finished && (
                  <div className="mt-2">
                    <progress className="progress progress-info h-1.5 w-full" value={pct} max={100} aria-label="索引進度" />
                    <div className="mt-0.5 text-right text-[10px] text-base-content/60">{pct}%</div>
                  </div>
                )}
              </>
            )}

            {job.reindexDrafted > 0 && (
              <div className="mt-1 text-xs text-warning-content">
                已有 <span className="font-bold">{job.reindexDrafted}</span> 篇文章因內容問題自動轉為草稿，原因寫在各文章編輯頁上方。
              </div>
            )}
            {finished && job.lastError && <div className="mt-1 text-xs text-error">{job.lastError}</div>}

            <div className="mt-2 flex flex-wrap gap-1.5">
              {finished && job.reindexDrafted > 0 && (
                <Link to="/announcements" className="btn btn-ghost btn-xs" onClick={dismiss}>
                  查看公告
                </Link>
              )}
              {finished && (
                <button type="button" className="btn btn-ghost btn-xs" onClick={dismiss}>
                  關閉
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
