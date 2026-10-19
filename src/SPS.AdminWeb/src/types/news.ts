// 公告（News）相關類型定義

export interface News {
  id: number;
  title: string;
  introduction?: string;
  content?: string;
  startDate?: string;
  endDate?: string;
  published: boolean;
  ordinal: number;
  categoryId?: number;
  categoryName?: string;
  /** 所有分類（依選擇順序；產業輔導的產業別可多選，第一個就是 categoryId） */
  categoryIds?: number[];
  categoryNames?: string[];
  type: number;
  /** 所屬專區：0 公告、1 服務專區 */
  section?: number;
  /** 附件檔案 Id（服務專區用，只有後台拿得到） */
  attachmentFileIds?: string[];
  attachmentCount?: number;
  /** 專區專屬欄位（人才培育的講師、產業輔導的主辦單位…） */
  meta?: Record<string, string>;
  viewCount: number;
  tags?: string[];
  /** 標籤（id + 名稱），編輯表單預選用 */
  tagItems?: { id: number; name: string }[];
  createdTime: string;
  updatedTime?: string;
  /** 封面圖網址（沒有設定封面圖時沒有值） */
  imageUrl?: string;
}

export interface CreateNewsRequest {
  title: string;
  introduction?: string;
  content?: string;
  startDate?: string;
  endDate?: string;
  published: boolean;
  ordinal?: number;
  categoryId?: number;
  /** 多個分類；有帶就以這個為準（categoryId 取第一個） */
  categoryIds?: number[];
  type: number;
  section?: number;
  /** 附件：檔案管理中的檔案 Id（服務專區用） */
  attachmentFileIds?: string[];
  /** 專區專屬欄位 */
  meta?: Record<string, string>;
  /** 標籤 ID 清單（公告標籤管理頁維護） */
  tagIds?: number[];
  /** 封面圖：檔案管理中的圖片檔案 Id */
  coverFileId?: string;
}

export interface UpdateNewsRequest {
  title?: string;
  introduction?: string;
  content?: string;
  startDate?: string;
  endDate?: string;
  published?: boolean;
  ordinal?: number;
  categoryId?: number;
  /** 日期欄位沒帶＝不更新，所以清除日期要另外帶 true */
  clearStartDate?: boolean;
  clearEndDate?: boolean;
  /** 沒帶＝不動分類；帶空陣列＝清空分類 */
  categoryIds?: number[];
  type?: number;
  section?: number;
  /** 沒帶＝不動附件；帶空陣列＝清空附件 */
  attachmentFileIds?: string[];
  /** 沒帶＝不動；帶了就整組取代 */
  meta?: Record<string, string>;
  /** 沒帶＝不動標籤；帶空陣列＝清空標籤 */
  tagIds?: number[];
  /** 換封面圖：檔案管理中的圖片檔案 Id；沒帶＝不更新 */
  coverFileId?: string;
  /** true＝移除封面圖 */
  removeCover?: boolean;
}

export interface NewsSearchParams {
  search?: string;
  categoryId?: number;
  type?: number;
  /** 只列這個專區：0 公告、1 服務專區 */
  section?: number;
  published?: boolean;
  tagId?: number;
  startDateFrom?: string;
  startDateTo?: string;
}

export interface NewsStatistics {
  totalNews: number;
  published: number;
  draft: number;
  scheduled: number;
  todayPublished: number;
  thisMonthPublished: number;
  totalViews: number;
}
