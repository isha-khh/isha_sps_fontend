import { useEffect } from 'react';
import { filesManagementApi } from '@/lib/api/files-management';
import { isImageCompressionActive, useImageCompressionStore } from '@/stores/image-compression-store';
import type { ImageCompressionJob } from '@/types/files';

const POLL_INTERVAL_MS = 2000;

/**
 * 全域追蹤「壓縮所有圖片」任務的進度。掛在 AdminLayout 一次即可。
 * - 進入後台時查一次：若有任務正在跑（例如重新整理頁面），接著顯示進度；已結束的舊任務不再彈出
 * - 任務排隊中／執行中時每 2 秒輪詢，結束後停止
 * - 輪詢發現後端沒有這個任務了（伺服器重啟），標示為中斷
 */
export function useImageCompressionPolling(enabled: boolean) {
  const active = useImageCompressionStore((s) => isImageCompressionActive(s.job));
  const setJob = useImageCompressionStore((s) => s.setJob);
  const setPendingCount = useImageCompressionStore((s) => s.setPendingCount);

  // 進入後台時查一次
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    filesManagementApi
      .getImageCompressionStatus()
      .then((st) => {
        if (cancelled) return;
        setPendingCount(st.pendingCount);
        setJob(st.job, { show: isImageCompressionActive(st.job) });
      })
      .catch(() => {
        // 查不到就當沒有任務
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, setJob, setPendingCount]);

  // 任務進行中時輪詢
  useEffect(() => {
    if (!enabled || !active) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const st = await filesManagementApi.getImageCompressionStatus();
        if (cancelled) return;
        setPendingCount(st.pendingCount);
        const tracked = useImageCompressionStore.getState().job;
        if (!tracked) return;
        if (st.job && st.job.id === tracked.id) {
          setJob(st.job);
        } else {
          const interrupted: ImageCompressionJob = {
            ...tracked,
            status: 'Failed',
            error: '伺服器已重新啟動，任務中斷。已轉好的檔案不受影響，再按一次「壓縮所有圖片」會從剩下的接續。',
          };
          setJob(interrupted);
        }
      } catch {
        // 暫時失敗，下一輪再試
      }
    };

    const handle = window.setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(handle);
    };
  }, [enabled, active, setJob, setPendingCount]);
}
