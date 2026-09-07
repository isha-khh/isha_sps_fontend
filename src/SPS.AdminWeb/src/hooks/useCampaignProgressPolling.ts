import { useEffect } from 'react';
import { mailCampaignsApi } from '@/lib/api/mailCampaigns';
import { useCampaignProgressStore, isTerminal } from '@/stores/campaign-progress-store';

const POLL_INTERVAL_MS = 4000;

/**
 * 全域輪詢追蹤中的 campaign 進度。掛在 AdminLayout 一次即可
 * - 只 poll 尚未到達終態的 campaign
 * - 終態後保留在 store（仍顯示終態 toast），由 user 手動 dismiss
 */
export function useCampaignProgressPolling() {
  const campaigns = useCampaignProgressStore((s) => s.campaigns);
  const updateDetail = useCampaignProgressStore((s) => s.updateDetail);

  useEffect(() => {
    const inFlightIds = Object.values(campaigns)
      .filter((c) => !isTerminal(c))
      .map((c) => c.id);

    if (inFlightIds.length === 0) return;

    let cancelled = false;
    const tick = async () => {
      await Promise.all(
        inFlightIds.map(async (id) => {
          try {
            const detail = await mailCampaignsApi.getById(id);
            if (cancelled) return;
            updateDetail(id, detail);
          } catch {
            // 暫時忽略單筆失敗，下一輪會再試
          }
        })
      );
    };

    void tick();
    const handle = window.setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(handle);
    };
  }, [campaigns, updateDetail]);
}
