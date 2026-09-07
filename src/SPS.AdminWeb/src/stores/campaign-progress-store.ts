import { create } from 'zustand';
import type { CampaignListItem } from '@/types/mailCampaign';
import { EmailCampaignStatus } from '@/types/mailCampaign';

export interface TrackedCampaign {
  id: string;
  subject: string;
  /** 上一次從 API 取得的詳情；未取得前為 null */
  detail: CampaignListItem | null;
  /** 預期總數（enqueue 時帶入，避免 detail 還沒回來時看不到分母） */
  expectedTotal: number;
  /** 已被使用者關閉的 toast，會從顯示中移除（但仍可由列表頁查看） */
  dismissed: boolean;
  /** 最後一次成功 poll 的時間（ms） */
  lastPollAt?: number;
}

const TERMINAL_STATUSES: number[] = [
  EmailCampaignStatus.Completed,
  EmailCampaignStatus.Failed,
  EmailCampaignStatus.Cancelled,
];

export function isTerminal(c: TrackedCampaign): boolean {
  return c.detail !== null && TERMINAL_STATUSES.includes(c.detail.status);
}

interface CampaignProgressState {
  campaigns: Record<string, TrackedCampaign>;
  track: (id: string, subject: string, expectedTotal: number) => void;
  updateDetail: (id: string, detail: CampaignListItem) => void;
  dismiss: (id: string) => void;
  remove: (id: string) => void;
  clearTerminal: () => void;
}

export const useCampaignProgressStore = create<CampaignProgressState>()((set) => ({
  campaigns: {},

  track: (id, subject, expectedTotal) =>
    set((state) => ({
      campaigns: {
        ...state.campaigns,
        [id]: {
          id,
          subject,
          detail: null,
          expectedTotal,
          dismissed: false,
        },
      },
    })),

  updateDetail: (id, detail) =>
    set((state) => {
      const prev = state.campaigns[id];
      if (!prev) return state;
      return {
        campaigns: {
          ...state.campaigns,
          [id]: { ...prev, detail, lastPollAt: Date.now() },
        },
      };
    }),

  dismiss: (id) =>
    set((state) => {
      const prev = state.campaigns[id];
      if (!prev) return state;
      return {
        campaigns: {
          ...state.campaigns,
          [id]: { ...prev, dismissed: true },
        },
      };
    }),

  remove: (id) =>
    set((state) => {
      const next = { ...state.campaigns };
      delete next[id];
      return { campaigns: next };
    }),

  clearTerminal: () =>
    set((state) => {
      const next: Record<string, TrackedCampaign> = {};
      for (const [k, v] of Object.entries(state.campaigns)) {
        if (!isTerminal(v)) next[k] = v;
      }
      return { campaigns: next };
    }),
}));
