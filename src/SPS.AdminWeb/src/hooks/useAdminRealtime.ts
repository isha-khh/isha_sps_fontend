import { useEffect } from 'react';
import * as signalR from '@microsoft/signalr';
import { contentCheckApi } from '@/lib/api/content-check';
import { filesManagementApi } from '@/lib/api/files-management';
import { useContentCheckStore } from '@/stores/content-check-store';
import { useImageCompressionStore } from '@/stores/image-compression-store';
import type { ContentCheckJob } from '@/types/content-check';
import type { ImageCompressionJob } from '@/types/files';

interface AdminRealtimeOptions {
  /** 有「系統設定」權限：收「內容檢查」進度 */
  contentCheck: boolean;
  /** 有「檔案管理」權限：收「壓縮所有圖片」進度 */
  imageCompression: boolean;
}

/**
 * 後台即時通知（SignalR `/hubs/admin`，只有後台使用者能連，後端依權限分組推送，沒有權限的事件收不到）。
 * 目前推兩種背景任務的進度到右上角鈴鐺：內容檢查（`ArticleCheckProgress`）、壓縮所有圖片（`ImageCompressionProgress`）。
 * 掛在 AdminLayout 一次即可。連上（含斷線重連）之後各查一次最近的任務狀態，這樣重新整理頁面、
 * 或斷線期間漏掉的事件都能補回來。兩項權限都沒有的人不連。
 */
export function useAdminRealtime({ contentCheck, imageCompression }: AdminRealtimeOptions) {
  const applyCheck = useContentCheckStore((s) => s.apply);
  const applyCompression = useImageCompressionStore((s) => s.apply);
  const setPendingCount = useImageCompressionStore((s) => s.setPendingCount);

  useEffect(() => {
    if (!contentCheck && !imageCompression) return;
    let disposed = false;

    const syncStatus = () => {
      if (contentCheck) {
        contentCheckApi
          .getStatus()
          .then((job) => {
            if (!disposed && job) applyCheck(job, { fromStatusQuery: true });
          })
          .catch(() => {
            // 查不到就當沒有任務
          });
      }
      if (imageCompression) {
        filesManagementApi
          .getImageCompressionStatus()
          .then((st) => {
            if (disposed) return;
            setPendingCount(st.pendingCount);
            if (st.job) applyCompression(st.job, { fromStatusQuery: true });
          })
          .catch(() => {
            // 查不到就當沒有任務
          });
      }
    };

    const connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/admin', { withCredentials: true })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on('ArticleCheckProgress', (job: ContentCheckJob) => {
      if (!disposed) applyCheck(job);
    });
    connection.on('ImageCompressionProgress', (job: ImageCompressionJob) => {
      if (!disposed) applyCompression(job);
    });
    connection.onreconnected(syncStatus);

    connection
      .start()
      .then(syncStatus)
      .catch((error) => {
        // 連不上（例如 nginx 沒轉 /hubs）：不影響其他功能，進度改靠各功能頁的手動重新整理
        console.warn('[admin realtime] 連線失敗', error);
        syncStatus();
      });

    return () => {
      disposed = true;
      void connection.stop();
    };
  }, [contentCheck, imageCompression, applyCheck, applyCompression, setPendingCount]);
}
