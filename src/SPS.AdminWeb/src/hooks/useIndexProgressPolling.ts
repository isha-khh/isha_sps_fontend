import { useEffect } from 'react';
import { settingsApi } from '@/lib/api/system-settings';
import { isIndexRunActive, useIndexProgressStore } from '@/stores/index-progress-store';

const IDLE_INTERVAL_MS = 15000;
const ACTIVE_INTERVAL_MS = 2000;

/**
 * 全域追蹤背景索引（全量重新索引 + 內容檢查）的進度，掛在 AdminLayout 一次即可，只有「系統設定」權限的人會查。
 * 平常每 15 秒看一眼有沒有一輪在跑（別人在設定頁按了「全部重新索引」也會看到）；一輪進行中每 2 秒更新，結束後回到慢速。
 * 用輕量的 `index-job` 端點（只回工作狀態，不算筆數統計）。
 */
export function useIndexProgressPolling(enabled: boolean) {
  const active = useIndexProgressStore((s) => isIndexRunActive(s.run));
  const apply = useIndexProgressStore((s) => s.apply);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const job = await settingsApi.getEmbeddingIndexJob();
        if (!cancelled) apply(job);
      } catch {
        // 暫時失敗（例如剛好換頁、網路中斷），下一輪再試
      }
    };

    void tick();
    const handle = window.setInterval(tick, active ? ACTIVE_INTERVAL_MS : IDLE_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(handle);
    };
  }, [enabled, active, apply]);
}
