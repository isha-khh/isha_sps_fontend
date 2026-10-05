import { apiClient } from '@/lib/api-client';

/** 投稿格式檔目前選到的檔案（檔案已被刪除或副檔名不符時後端回 null） */
export interface ContributeFormatFile {
  kind: 'docx' | 'odt' | 'pdf';
  fileId: string;
  fileName: string;
  fileSize: number;
  formattedFileSize: string;
  url: string;
}

export interface ContributePageSettings {
  odtFileId: string | null;
  pdfFileId: string | null;
  docxFileId: string | null;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
}

export interface ContributePageAdminData {
  settings: ContributePageSettings;
  odt: ContributeFormatFile | null;
  pdf: ContributeFormatFile | null;
  docx: ContributeFormatFile | null;
}

/** 下載資源項目目前選到的檔案（檔案已刪除或副檔名不符時後端回 null） */
export interface DownloadResourceFile {
  kind: 'docx' | 'odt' | 'pdf';
  fileId: string;
  fileName: string;
  fileSize: number;
  formattedFileSize: string;
  url: string;
}

/** 一個下載資源項目（固定項目，由後端目錄定義；後台只能改檔案與外部連結） */
export interface DownloadResourceItem {
  key: string;
  group: string;
  title: string;
  usedAt: string;
  /** 允許的格式（不含點）；空陣列＝只能設外部連結 */
  formats: Array<'docx' | 'odt' | 'pdf'>;
  docxFileId: string | null;
  odtFileId: string | null;
  pdfFileId: string | null;
  externalUrl: string;
  docx: DownloadResourceFile | null;
  odt: DownloadResourceFile | null;
  pdf: DownloadResourceFile | null;
}

export interface DownloadResourceUpdate {
  key: string;
  docxFileId: string | null;
  odtFileId: string | null;
  pdfFileId: string | null;
  externalUrl: string;
}

export const pageSettingsApi = {
  /**
   * 取得「我要投稿」頁設定
   * GET /api/page-settings/contribute
   */
  async getContribute(): Promise<ContributePageAdminData> {
    const response = await apiClient.get<ContributePageAdminData>('/api/page-settings/contribute');
    return response.data;
  },

  /**
   * 更新「我要投稿」頁設定
   * PUT /api/page-settings/contribute
   *
   * 檔案不存在／副檔名不符、信箱或電話格式不正確時後端回 400 `{ error }`，由呼叫端顯示。
   */
  async updateContribute(settings: ContributePageSettings): Promise<void> {
    await apiClient.put('/api/page-settings/contribute', settings);
  },

  /**
   * 取得所有下載資源
   * GET /api/page-settings/downloads
   */
  async getDownloads(): Promise<DownloadResourceItem[]> {
    const response = await apiClient.get<{ items: DownloadResourceItem[] }>('/api/page-settings/downloads');
    return response.data.items;
  },

  /**
   * 更新下載資源（只送要改的項目）
   * PUT /api/page-settings/downloads
   *
   * 檔案不存在／副檔名不符、連結不是 http(s) 時後端回 400 `{ error }`，由呼叫端顯示。
   */
  async updateDownloads(items: DownloadResourceUpdate[]): Promise<void> {
    await apiClient.put('/api/page-settings/downloads', { items });
  },
};
