// 成功案例相關類型定義

export interface SuccessCase {
  id: number;
  title: string;
  companyName: string;
  industry: string;
  coverImageUrl?: string;
  summary: string;
  content: string;
  tags?: string[];
  publishedDate?: string;
  isPublished: boolean;
  viewCount: number;
  /** 關聯企業（平台上的企業 Id，依顯示順序）：前台案例頁的「公司簡介」區塊用 */
  companyIds?: string[];
  createdTime: string;
  updatedTime?: string;
}

export interface CreateSuccessCaseRequest {
  title: string;
  companyName: string;
  industry: string;
  coverImageUrl?: string;
  summary: string;
  content: string;
  tags?: string[];
  publishedDate?: string;
  isPublished?: boolean;
  /** 關聯企業（企業 Id，依顯示順序） */
  companyIds?: string[];
}

export interface UpdateSuccessCaseRequest {
  title?: string;
  companyName?: string;
  industry?: string;
  coverImageUrl?: string;
  summary?: string;
  content?: string;
  tags?: string[];
  publishedDate?: string;
  /** 發布日期沒帶＝不更新，所以清除要另外帶 true（已發布的案例後端會補上當下時間） */
  clearPublishedDate?: boolean;
  isPublished?: boolean;
  /** 沒帶＝不動，帶空陣列＝清空 */
  companyIds?: string[];
}

export interface SuccessCaseSearchParams {
  search?: string;
  industry?: string;
  isPublished?: boolean;
}

export interface SuccessCaseStatistics {
  totalCases: number;
  publishedCases: number;
  draftCases: number;
  totalViews: number;
}
