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
  dismiss: () => void;
}

export const useImageCompressionStore = create<ImageCompressionState>()((set) => ({
  job: null,
  pendingCount: null,
  dismissed: true,

  setPendingCount: (pendingCount) => set({ pendingCount }),

  setJob: (job, opts) =>
    set((state) => ({
      job,
      dismissed: opts?.show ? false : state.dismissed,
    })),

  dismiss: () => set({ dismissed: true }),
}));
