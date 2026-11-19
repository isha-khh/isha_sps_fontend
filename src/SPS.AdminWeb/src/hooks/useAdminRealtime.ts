import { useEffect } from 'react';
import * as signalR from '@microsoft/signalr';
import { contentCheckApi } from '@/lib/api/content-check';
import { useContentCheckStore } from '@/stores/content-check-store';
import type { ContentCheckJob } from '@/types/content-check';

/**
 * 後台即時通知（SignalR `/hubs/admin`，只有後台使用者能連，後端依「系統設定」權限決定收不收得到）。
 * 目前推的是「內容檢查」的進度；掛在 AdminLayout 一次即可。
 * 連上（含斷線重連）之後查一次最近的任務狀態，這樣重新整理頁面、或斷線期間漏掉的事件都能補回來。
 * 沒有「系統設定」權限的人（enabled=false）不連。
 */
export function useAdminRealtime(enabled: boolean) {
  const apply = useContentCheckStore((s) => s.apply);

  useEffect(() => {
    if (!enabled) return;
    let disposed = false;

    const syncStatus = () => {
      contentCheckApi
        .getStatus()
        .then((job) => {
          if (!disposed && job) apply(job, { fromStatusQuery: true });
        })
        .catch(() => {
          // 查不到就當沒有任務
        });
    };

    const connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/admin', { withCredentials: true })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on('ArticleCheckProgress', (job: ContentCheckJob) => {
      if (!disposed) apply(job);
    });
    connection.onreconnected(syncStatus);

    connection
      .start()
      .then(syncStatus)
      .catch((error) => {
        // 連不上（例如 nginx 沒轉 /hubs）：不影響其他功能，進度改靠設定頁的手動重新整理
        console.warn('[admin realtime] 連線失敗', error);
        syncStatus();
      });

    return () => {
      disposed = true;
      void connection.stop();
    };
  }, [enabled, apply]);
}
