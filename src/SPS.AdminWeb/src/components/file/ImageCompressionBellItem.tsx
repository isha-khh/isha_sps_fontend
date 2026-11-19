import { useState } from 'react';
import { Link } from 'react-router-dom';
import { filesManagementApi } from '@/lib/api/files-management';
import { isImageCompressionActive, useImageCompressionStore } from '@/stores/image-compression-store';

const formatBytes = (bytes: number): string => {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(0, Math.round(bytes / 1024))} KB`;
};

/**
 * 鈴鐺「全部／系統」分頁最上面的「壓縮所有圖片」進度卡片：進行中顯示進度條與百分比（SignalR 即時更新），可取消；
 * 結束後顯示結果直到使用者關閉，結果同時會在「系統」通知列表裡留一則（結束時後端寫入）。
 */
export const ImageCompressionBellItem = () => {
  const job = useImageCompressionStore((s) => s.job);
  const dismissed = useImageCompressionStore((s) => s.dismissed);
  const dismiss = useImageCompressionStore((s) => s.dismiss);
  const [cancelling, setCancelling] = useState(false);

  if (!job || dismissed) return null;

  const active = isImageCompressionActive(job);
  const queued = job.status === 'Queued';
  const pct = job.total > 0 ? Math.min(100, Math.round((job.processed / job.total) * 100)) : 0;

  // 失敗才用警告色；檔案遺失是舊資料問題（不是壓縮的錯），在文字裡另外說明就好
  const warn = job.status === 'Completed' && job.failed > 0;
  const color = active ? 'bg-info' : job.status === 'Completed' ? (warn ? 'bg-warning' : 'bg-success') : job.status === 'Cancelled' ? 'bg-neutral' : 'bg-error';
  const icon = active ? 'lucide--image-down' : job.status === 'Completed' ? (warn ? 'lucide--alert-triangle' : 'lucide--check-circle') : job.status === 'Cancelled' ? 'lucide--circle' : 'lucide--x-circle';

  const headline =
    job.status === 'Queued' ? '圖片壓縮：已排入佇列'
      : job.status === 'Running' ? '圖片壓縮：處理中'
        : job.status === 'Completed' ? (warn ? '圖片壓縮：部分失敗' : '圖片壓縮：完成')
          : job.status === 'Cancelled' ? '圖片壓縮：已取消'
            : '圖片壓縮：中斷';

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await filesManagementApi.cancelImageCompression(job.id);
    } catch {
      // 任務可能剛好結束，下一個進度事件會更新狀態
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <div className="relative flex items-start gap-3 p-4" role="status" aria-live="polite">
        <div className="avatar size-12">
          <div className={`mask mask-squircle flex items-center justify-center ${color}`}>
            <span className={`iconify ${icon} size-6 text-white`} />
          </div>
        </div>

        <div className="grow min-w-0">
          <p className="text-sm leading-tight font-medium">{headline}</p>

          {queued ? (
            <p className="text-base-content/70 mt-1 text-xs">等待開始處理…</p>
          ) : job.status === 'Failed' ? (
            <p className="text-error mt-1 text-xs">{job.error || '處理過程發生錯誤'}</p>
          ) : (
            <p className="text-base-content/70 mt-1 text-xs whitespace-pre-line">
              {job.processed} / {job.total} 張（轉成 WebP {job.converted}・維持原檔 {job.keptOriginal}{job.missing > 0 ? `・檔案遺失 ${job.missing}` : ''}・失敗 {job.failed}）{'\n'}
              {active ? '已省下' : '共省下'} {formatBytes(job.savedBytes)}
              {job.status === 'Cancelled' ? '\n再按一次「壓縮所有圖片」會從剩下的接續。' : ''}
              {!active && job.missing > 0 ? `\n檔案遺失：資料庫有 ${job.missing} 筆圖片紀錄，但磁碟上找不到檔案，已略過（伺服器日誌有清單）。` : ''}
            </p>
          )}

          {active && (
            <div className="mt-2">
              <progress className="progress progress-info h-1.5 w-full" value={queued ? undefined : pct} max={100} aria-label="圖片壓縮進度" />
              {!queued && <div className="text-base-content/60 mt-0.5 text-right text-[10px]">{pct}%</div>}
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {active ? (
              <button type="button" className="btn btn-xs btn-ghost" onClick={() => void handleCancel()} disabled={cancelling}>
                取消
              </button>
            ) : (
              <>
                <Link to="/content/files" className="btn btn-xs btn-primary" onClick={dismiss}>
                  前往檔案管理
                </Link>
                <button type="button" className="btn btn-xs btn-ghost" onClick={dismiss}>
                  關閉
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <hr className="border-base-300 border-dashed" />
    </>
  );
};
