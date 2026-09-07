// 常見問題相關類型定義

/**
 * 問題回應資料
 */
export interface QuestionResponse {
  id: number;
  subject?: string;
  answer?: string;
  published: boolean;
  ordinal: number;
  categoryId?: number;
  categoryName?: string;
  createdTime: string;
  updatedTime?: string;
}

/**
 * 創建問題請求
 */
export interface CreateQuestionRequest {
  subject: string;
  answer: string;
  published?: boolean;
  ordinal?: number;
  categoryId?: number;
}

/**
 * 更新問題請求
 */
export interface UpdateQuestionRequest {
  subject?: string;
  answer?: string;
  published?: boolean;
  ordinal?: number;
  categoryId?: number;
}

/**
 * 問題查詢參數
 */
export interface QuestionQueryParameters {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  descending?: boolean;
  categoryId?: number;
  published?: boolean;
}
