import { create } from 'zustand';
import type { ImageCompressionJob } from '@/types/files';

export const isImageCompressionActive = (job: ImageCompressionJob | null): boolean =>
  job !== null && (job.status === 'Queued' || job.status === 'Running');

interface ImageCompressionState {
  /** 追蹤中的壓縮任務（null ＝ 沒有） */
  job: ImageCompressionJob | null;
  /** 目前還沒壓縮過的圖片數；尚未取得時為 null */
  pendingCount: number | null;
  /** 使用者已關閉通知（任務結束後才可關閉） */
  dismissed: boolean;
  setPendingCount: (n: number) => void;
  /** 套用從後端取得的任務狀態；newJob=true 代表使用者剛按下按鈕，要重新顯示通知 */
  setJob: (job: ImageCompressionJob | null, opts?: { show?: boolean }) => void;
  /**
   * 套用 SignalR 推來（或進入後台時查到）的任務狀態：
   * - 進行中：顯示鈴鐺卡片（同一個任務使用者關掉後不會再跳出來，新的一輪才會）
   * - 已結束：只有這個分頁看過它在跑才顯示；剛進後台時查到已結束的舊任務不彈出（結果會在「系統」通知裡）
   */
  apply: (job: ImageCompressionJob, opts?: { fromStatusQuery?: boolean }) => void;
  dismiss: () => void;
}

export const useImageCompressionStore = create<ImageCompressionState>()((set, get) => ({
  job: null,
  pendingCount: null,
  dismissed: true,

  setPendingCount: (pendingCount) => set({ pendingCount }),

  setJob: (job, opts) =>
    set((state) => ({
      job,
      dismissed: opts?.show ? false : state.dismissed,
    })),

  apply: (job, opts) => {
    const current = get().job;
    const sameJob = current?.id === job.id;
    if (isImageCompressionActive(job)) {
      set({ job, dismissed: sameJob ? get().dismissed : false });
    } else if (sameJob && isImageCompressionActive(current)) {
      set({ job, dismissed: false });
    } else {
      set({ job, dismissed: opts?.fromStatusQuery ? true : get().dismissed });
    }
  },

  dismiss: () => set({ dismissed: true }),
}));
