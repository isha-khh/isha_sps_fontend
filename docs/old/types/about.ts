// 關於我們相關類型定義

/**
 * 關於回應資料
 */
export interface AboutResponse {
  id: number;
  name?: string;
  title?: string;
  content?: string;
  published: boolean;
  type: number;
  ordinal: number;
  version?: string;
  sendTime?: string;
  createdTime: string;
  updatedTime?: string;
}

/**
 * 創建關於請求
 */
export interface CreateAboutRequest {
  name: string;
  title: string;
  content?: string;
  published?: boolean;
  type?: number;
  ordinal?: number;
  version?: string;
  sendTime?: string;
}

/**
 * 更新關於請求
 */
export interface UpdateAboutRequest {
  name?: string;
  title?: string;
  content?: string;
  published?: boolean;
  type?: number;
  ordinal?: number;
  version?: string;
  sendTime?: string;
}

/**
 * 關於查詢參數
 */
export interface AboutQueryParameters {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  descending?: boolean;
  type?: number;
  published?: boolean;
}
