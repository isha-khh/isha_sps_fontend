// 法規相關類型定義

/**
 * 法規回應資料
 */
export interface RegulationsResponse {
  id: number;
  name?: string;
  title?: string;
  content?: string;
  published: boolean;
  type: number;
  ordinal: number;
  categoryId?: number;
  categoryName?: string;
  createdTime: string;
  updatedTime?: string;
}

/**
 * 創建法規請求
 */
export interface CreateRegulationsRequest {
  name: string;
  title?: string;
  content?: string;
  published?: boolean;
  type?: number;
  ordinal?: number;
  categoryId?: number;
}

/**
 * 更新法規請求
 */
export interface UpdateRegulationsRequest {
  name?: string;
  title?: string;
  content?: string;
  published?: boolean;
  type?: number;
  ordinal?: number;
  categoryId?: number;
}

/**
 * 法規查詢參數
 */
export interface RegulationsQueryParameters {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  descending?: boolean;
  categoryId?: number;
  type?: number;
  published?: boolean;
}
