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
