
// 相簿相關類型定義

/**
 * 相簿回應資料
 */
export interface AlbumResponse {
  id: number;
  number?: string;
  title?: string;
  published: boolean;
  startDate?: string;
  endDate?: string;
  ordinal: number;
  coverId?: number;
  coverUri?: string;
  pictureCount: number;
  videoCount: number;
  createdTime: string;
  updatedTime: string;
}

/**
 * 相簿列表項回應
 */
export type AlbumListItemResponse = AlbumResponse;

/**
 * 創建相簿請求
 */
export interface CreateAlbumRequest {
  number?: string;
  title: string;
  published: boolean;
  startDate?: string;
  endDate?: string;
  ordinal: number;
  coverId?: number;
}

/**
 * 更新相簿請求
 */
export interface UpdateAlbumRequest {
  number?: string;
  title?: string;
  published?: boolean;
  startDate?: string;
  endDate?: string;
  ordinal?: number;
  coverId?: number;
}

/**
 * 相簿查詢參數
 */
export interface AlbumQueryParameters {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  descending?: boolean;
  published?: boolean;
}
