import { create } from 'zustand';
import type { ContentCheckJob } from '@/types/content-check';

export const isContentCheckActive = (job: ContentCheckJob | null): boolean =>
  job !== null && (job.status === 'Queued' || job.status === 'Running');

interface ContentCheckState {
  /** 最近一個內容檢查任務（null ＝ 這個分頁還沒看過任何任務） */
  job: ContentCheckJob | null;
  /** 使用者已關閉鈴鐺裡的進度卡片（任務結束後才可關閉） */
  dismissed: boolean;
  /**
   * 套用後端回來（或 SignalR 推來）的任務狀態。
   * - 進行中：顯示卡片（同一個任務使用者關掉後不會再跳出來，新的一輪才會）
   * - 已結束：只有這個分頁看過它在跑才顯示；剛進後台時查到已結束的舊任務不彈出（結果會在「系統」通知裡）
   */
  apply: (job: ContentCheckJob, opts?: { fromStatusQuery?: boolean }) => void;
  dismiss: () => void;
}

export const useContentCheckStore = create<ContentCheckState>()((set, get) => ({
  job: null,
  dismissed: true,

  apply: (job, opts) => {
    const current = get().job;
    const sameJob = current?.id === job.id;

    if (isContentCheckActive(job)) {
      set({ job, dismissed: sameJob ? get().dismissed : false });
      return;
    }

    // 已結束：這個分頁原本就在追蹤同一個任務才顯示結果；從狀態查詢拿到的舊任務只更新資料、不彈出
    if (sameJob && isContentCheckActive(current)) {
      set({ job, dismissed: false });
    } else {
      set({ job, dismissed: opts?.fromStatusQuery ? true : get().dismissed });
    }
  },

  dismiss: () => set({ dismissed: true }),
}));
