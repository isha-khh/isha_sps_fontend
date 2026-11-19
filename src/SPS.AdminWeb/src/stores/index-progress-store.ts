import { create } from 'zustand';
import type { EmbeddingIndexJob } from '@/types/settings';

/** 通知列追蹤的一輪全量重新索引（含內容檢查） */
export interface TrackedIndexRun {
  /** 開始時間（後端 reindexStartedAt；還在排隊時為 null，用排隊時的本機時間當識別） */
  key: string;
  job: EmbeddingIndexJob;
  /** 這一輪已經結束（背景服務回到 idle） */
  finished: boolean;
}

interface IndexProgressState {
  run: TrackedIndexRun | null;
  dismissed: boolean;
  /** 套用後端回來的工作狀態；回傳值不重要，狀態轉換邏輯都在這裡 */
  apply: (job: EmbeddingIndexJob) => void;
  dismiss: () => void;
}

const isRunning = (job: EmbeddingIndexJob) => job.reindexQueued || job.phase === 'reindexing';

/**
 * 全量重新索引（AI 向量索引 + 內容檢查）的進度，給右下角通知用。
 * - 排隊中或進行中：顯示（使用者關掉之後，下一輪新的開始會再顯示）
 * - 結束：只有「這個分頁看過它在跑」才顯示完成摘要；剛進入後台時查到已經結束的舊一輪不彈出
 */
export const useIndexProgressStore = create<IndexProgressState>()((set, get) => ({
  run: null,
  dismissed: true,

  apply: (job) => {
    const { run } = get();
    if (isRunning(job)) {
      const key = job.reindexStartedAt ?? 'queued';
      const sameRun = run && !run.finished && (run.key === key || run.key === 'queued' || key === 'queued');
      set({ run: { key, job, finished: false }, dismissed: sameRun ? get().dismissed : false });
      return;
    }
    // 已回到 idle：只有原本在追蹤的那一輪才轉成「完成」
    if (run && !run.finished) {
      set({ run: { ...run, job, finished: true }, dismissed: false });
    }
  },

  dismiss: () => set({ dismissed: true }),
}));

export const isIndexRunActive = (run: TrackedIndexRun | null) => run !== null && !run.finished;
