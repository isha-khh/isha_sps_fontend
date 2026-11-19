import { apiClient } from '@/lib/api-client';
import type { ContentCheckJob, ContentCheckStartResult } from '@/types/content-check';

export const contentCheckApi = {
  /** 開始內容檢查（背景執行）。applyDraft=false 是預覽，只檢查不動文章 */
  async start(applyDraft: boolean): Promise<ContentCheckStartResult> {
    const response = await apiClient.post('/api/ContentCheck/start', { applyDraft });
    return response.data;
  },

  /** 最近一個任務的狀態；從來沒跑過是 null */
  async getStatus(): Promise<ContentCheckJob | null> {
    const response = await apiClient.get('/api/ContentCheck/status');
    return response.data?.job ?? null;
  },

  async cancel(id: string): Promise<void> {
    await apiClient.post(`/api/ContentCheck/${id}/cancel`);
  },
};
