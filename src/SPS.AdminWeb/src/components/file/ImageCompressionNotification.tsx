import { useState } from 'react';
import { filesManagementApi } from '@/lib/api/files-management';
import { isImageCompressionActive, useImageCompressionStore } from '@/stores/image-compression-store';

type Tone = 'info' | 'success' | 'warning' | 'error' | 'ghost';

const TONE_CLASSES: Record<Tone, { border: string; bg: string; icon: string; iconColor: string }> = {
  info:    { border: 'border-info/40',    bg: 'bg-info/5',    icon: 'lucide--image-down',     iconColor: 'text-info' },
  success: { border: 'border-success/40', bg: 'bg-success/5', icon: 'lucide--check-circle',   iconColor: 'text-success' },
  warning: { border: 'border-warning/40', bg: 'bg-warning/5', icon: 'lucide--alert-triangle', iconColor: 'text-warning' },
  error:   { border: 'border-error/40',   bg: 'bg-error/5',   icon: 'lucide--x-circle',       iconColor: 'text-error' },
  ghost:   { border: 'border-base-300',   bg: 'bg-base-200',  icon: 'lucide--circle',         iconColor: 'text-base-content/60' },
};

const formatBytes = (bytes: number): string => {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(0, Math.round(bytes / 1024))} KB`;
};

/**
 * 「壓縮所有圖片」進度通知（右下角，跟群發郵件的進度通知同一組）。
 * 任務進行中不可關閉（可按「取消」）；結束後顯示結果，手動關閉。
 */
export const ImageCompressionNotification = () => {
  const job = useImageCompressionStore((s) => s.job);
  const dismissed = useImageCompressionStore((s) => s.dismissed);
  const dismiss = useImageCompressionStore((s) => s.dismiss);
  const [cancelling, setCancelling] = useState(false);

  if (!job || dismissed) return null;

  const active = isImageCompressionActive(job);
  const pct = job.total > 0 ? Math.min(100, Math.round((job.processed / job.total) * 100)) : 0;

  let tone: Tone;
  let headline: string;
  let detail: string;
  switch (job.status) {
    case 'Queued':
      tone = 'info';
      headline = '圖片壓縮：已排入佇列';
      detail = '等待開始處理…';
      break;
    case 'Running':
      tone = 'info';
      headline = '圖片壓縮：處理中';
      detail = `${job.processed} / ${job.total} 張（轉成 WebP ${job.converted}・維持原檔 ${job.keptOriginal}・失敗 ${job.failed}）\n已省下 ${formatBytes(job.savedBytes)}`;
      break;
    case 'Completed':
      tone = job.failed > 0 ? 'warning' : 'success';
      headline = job.failed > 0 ? '圖片壓縮：部分失敗' : '圖片壓縮：完成';
      detail = `共處理 ${job.processed} 張：轉成 WebP ${job.converted}・維持原檔 ${job.keptOriginal}${job.failed > 0 ? `・失敗 ${job.failed}（多半是檔案遺失，伺服器日誌有詳情）` : ''}\n共省下 ${formatBytes(job.savedBytes)}`;
      break;
    case 'Cancelled':
      tone = 'ghost';
      headline = '圖片壓縮：已取消';
      detail = `取消前已處理 ${job.processed} 張，省下 ${formatBytes(job.savedBytes)}。再按一次會從剩下的接續。`;
      break;
    default:
      tone = 'error';
      headline = '圖片壓縮：中斷';
      detail = job.error || '處理過程發生錯誤';
  }
  const cls = TONE_CLASSES[tone];

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await filesManagementApi.cancelImageCompression(job.id);
    } catch {
      // 任務可能剛好結束，下一次輪詢會更新狀態
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-lg border ${cls.border} bg-base-100 shadow-md p-3 text-sm`} role="status">
      {/* 底色用不透明的 base-100 墊著，避免透出後面的頁面內容 */}
      <div className={`pointer-events-none absolute inset-0 ${cls.bg}`} />
      <div className="relative flex items-start gap-2">
        <span className={`iconify ${cls.icon} size-5 mt-0.5 ${cls.iconColor}`} />
        <div className="grow min-w-0">
          <div className="font-semibold">{headline}</div>
          <div className="text-xs text-base-content/70 whitespace-pre-line">{detail}</div>

          {job.status === 'Running' && (
            <div className="mt-2">
              <progress className="progress progress-info w-full h-1.5" value={pct} max={100} />
              <div className="text-[10px] text-base-content/60 text-right mt-0.5">{pct}%</div>
            </div>
          )}
          {job.status === 'Queued' && <progress className="progress progress-info w-full h-1.5 mt-2" />}

          {active && (
            <div className="mt-2">
              <button className="btn btn-xs btn-ghost" onClick={handleCancel} disabled={cancelling}>
                取消
              </button>
            </div>
          )}
        </div>
        {!active && (
          <button type="button" className="btn btn-ghost btn-xs btn-circle" onClick={dismiss} aria-label="關閉">
            <span className="iconify lucide--x size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
