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
  type: number;
  viewCount: number;
  tags?: string[];
  /** 標籤（id + 名稱），編輯表單預選用 */
  tagItems?: { id: number; name: string }[];
  createdTime: string;
  updatedTime?: string;
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
  type: number;
  /** 標籤 ID 清單（公告標籤管理頁維護） */
  tagIds?: number[];
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
  type?: number;
  /** 沒帶＝不動標籤；帶空陣列＝清空標籤 */
  tagIds?: number[];
}

export interface NewsSearchParams {
  search?: string;
  categoryId?: number;
  type?: number;
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
