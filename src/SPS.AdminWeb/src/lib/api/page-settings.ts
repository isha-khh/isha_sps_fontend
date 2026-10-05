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
};
