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
  tags?: string[];
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
  tags?: string[];
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
  tags?: string[];
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
  publishedNews: number;
  draftNews: number;
  newsThisMonth: number;
}
