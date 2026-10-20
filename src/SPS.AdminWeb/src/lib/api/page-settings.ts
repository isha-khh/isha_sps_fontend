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
  /** 主視覺圖片（檔案管理中的圖片檔案 id）；沒設定前台用預設圖片 */
  imageFileId: string | null;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  /** 頁面文字：分類標籤、日期、撰稿人、投稿說明（空白行分段）；留空前台不顯示那一塊 */
  tag: string;
  date: string;
  contributor: string;
  introduction: string;
}

export interface ContributePageAdminData {
  settings: ContributePageSettings;
  odt: ContributeFormatFile | null;
  pdf: ContributeFormatFile | null;
  docx: ContributeFormatFile | null;
  /** 目前選的主視覺圖片（檔案已刪除或不是圖片時後端回 null） */
  image: { fileId: string; fileName: string; formattedFileSize: string; url: string } | null;
}

/** 下載資源項目目前選到的檔案（檔案已刪除或副檔名不符時後端回 null） */
export interface DownloadResourceFile {
  kind: 'docx' | 'odt' | 'pdf' | 'zip';
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
  formats: Array<'docx' | 'odt' | 'pdf' | 'zip'>;
  docxFileId: string | null;
  odtFileId: string | null;
  pdfFileId: string | null;
  zipFileId: string | null;
  externalUrl: string;
  docx: DownloadResourceFile | null;
  odt: DownloadResourceFile | null;
  pdf: DownloadResourceFile | null;
  zip: DownloadResourceFile | null;
}

export interface DownloadResourceUpdate {
  key: string;
  docxFileId: string | null;
  odtFileId: string | null;
  pdfFileId: string | null;
  zipFileId: string | null;
  externalUrl: string;
}

/** 「關於我們」頁的文字內容 */
export interface AboutMilestone {
  year: string;
  title: string;
  items: string[];
}

export interface AboutPageSettings {
  title: string;
  intro: string;
  milestones: AboutMilestone[];
  visionTitle: string;
  visionLine: string;
  visionHighlight: string;
}

/** 「XR」頁（前台 /talent/xr）的頁籤：名稱、介紹文字、模組下載連結 */
export interface XrDownloadLink {
  label: string;
  url: string;
}

export interface XrTab {
  /** 識別碼；新增頁籤時留空，由後端產生 */
  id: string;
  label: string;
  /** 使用前台內建的動火作業介紹版面（只有識別碼 fire-work 的頁籤可以開） */
  useBuiltInLayout: boolean;
  introduction: string;
  links: XrDownloadLink[];
}

export interface XrPageSettings {
  tabs: XrTab[];
}

/** 補助專區頁首的資訊區塊 */
export interface SupportInfoItem {
  label: string;
  children: string[];
  /** 聯絡電話（選填）；有填電話或信箱時，前台用「姓名＋電話＋信箱」的聯絡人版面 */
  phone?: string | null;
  /** 聯絡信箱（選填） */
  email?: string | null;
}

export interface SupportInfoBlock {
  icon: string;
  title: string;
  items: SupportInfoItem[];
  fullTextResourceKey: string | null;
  fullTextLabel: string | null;
}

export interface SupportInfoSettings {
  blocks: SupportInfoBlock[];
}

/** 「產業AI」外部連結開關 */
export interface IndustryAiLinkSettings {
  enabled: boolean;
  url: string;
  newTab: boolean;
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

  /** GET /api/page-settings/xr（沒設定過就是原本的兩個頁籤） */
  async getXr(): Promise<XrPageSettings> {
    const response = await apiClient.get<XrPageSettings>('/api/page-settings/xr');
    return response.data;
  },

  /** PUT /api/page-settings/xr（名稱空白、連結網址不正確等後端回 400 `{ error }`） */
  async updateXr(settings: XrPageSettings): Promise<void> {
    await apiClient.put('/api/page-settings/xr', settings);
  },

  /** GET /api/page-settings/about */
  async getAbout(): Promise<AboutPageSettings> {
    const response = await apiClient.get<AboutPageSettings>('/api/page-settings/about');
    return response.data;
  },

  /** PUT /api/page-settings/about（欄位太長、歷程缺年份或標題時後端回 400 `{ error }`） */
  async updateAbout(settings: AboutPageSettings): Promise<void> {
    await apiClient.put('/api/page-settings/about', settings);
  },

  /** GET /api/page-settings/support-info */
  async getSupportInfo(): Promise<SupportInfoSettings> {
    const response = await apiClient.get<SupportInfoSettings>('/api/page-settings/support-info');
    return response.data;
  },

  /** PUT /api/page-settings/support-info（圖示不在清單內、連結的下載資源不存在時後端回 400 `{ error }`） */
  async updateSupportInfo(settings: SupportInfoSettings): Promise<void> {
    await apiClient.put('/api/page-settings/support-info', settings);
  },

  /** GET /api/page-settings/industry-ai-link */
  async getIndustryAiLink(): Promise<IndustryAiLinkSettings> {
    const response = await apiClient.get<IndustryAiLinkSettings>('/api/page-settings/industry-ai-link');
    return response.data;
  },

  /** PUT /api/page-settings/industry-ai-link（開啟時沒填網址、網址不是 http／https 時後端回 400 `{ error }`） */
  async updateIndustryAiLink(settings: IndustryAiLinkSettings): Promise<void> {
    await apiClient.put('/api/page-settings/industry-ai-link', settings);
  },
};
