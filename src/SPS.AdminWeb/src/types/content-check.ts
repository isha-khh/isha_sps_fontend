// 內容檢查（逐篇檢查已發布文章，有問題依選項轉草稿）相關類型，對應後端 ArticleCheckJobDto

export type ContentCheckStatus = 'Queued' | 'Running' | 'Completed' | 'Cancelled' | 'Failed';

export interface ContentCheckFinding {
  /** News／Faq／Case／Regulation */
  kind: string;
  id: number;
  title?: string | null;
  reason: string;
  /** true＝已轉成草稿；false＝預覽只回報 */
  drafted: boolean;
}

export interface ContentCheckJob {
  id: string;
  status: ContentCheckStatus;
  /** true＝有問題的文章轉成草稿；false＝預覽 */
  applyDraft: boolean;
  total: number;
  checked: number;
  /** 有「錯誤」的文章篇數 */
  flagged: number;
  drafted: number;
  percent: number;
  findings: ContentCheckFinding[];
  requestedBy?: string | null;
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  error?: string | null;
}

export interface ContentCheckStartResult {
  job: ContentCheckJob;
  alreadyActive: boolean;
}

export const CONTENT_CHECK_KIND_LABELS: Record<string, string> = {
  News: '公告',
  Faq: '常見問題',
  Case: '產業案例',
  Regulation: '法規',
};
