// 圖片相關類型定義

/**
 * 圖片回應資料
 */
export interface PictureResponse {
  id: number;
  name?: string;
  culture?: string;
  type: number;
  contentType?: string;
  uri?: string;
  thumbnailUri?: string;
  linkUrl?: string;
  published: boolean;
  startDate?: string;
  endDate?: string;
  ordinal: number;
  height: number;
  width: number;
  dpi: number;
  remark?: string;
  albumId?: number;
  albumTitle?: string;
  multilingualImageId?: number;
  createdTime: string;
  updatedTime: string;
}

/**
 * 圖片列表項回應
 */
export interface PictureListItemResponse extends PictureResponse {}

/**
 * 創建圖片請求
 */
export interface CreatePictureRequest {
  name: string;
  culture?: string;
  type: number;
  contentType?: string;
  uri: string;
  thumbnailUri?: string;
  linkUrl?: string;
  published: boolean;
  startDate?: string;
  endDate?: string;
  ordinal: number;
  height: number;
  width: number;
  dpi: number;
  remark?: string;
  albumId?: number;
  multilingualImageId?: number;
}

/**
 * 更新圖片請求
 */
export interface UpdatePictureRequest {
  name?: string;
  culture?: string;
  type?: number;
  contentType?: string;
  uri?: string;
  thumbnailUri?: string;
  linkUrl?: string;
  published?: boolean;
  startDate?: string;
  endDate?: string;
  ordinal?: number;
  height?: number;
  width?: number;
  dpi?: number;
  remark?: string;
  albumId?: number;
  multilingualImageId?: number;
}

/**
 * 圖片查詢參數
 */
export interface PictureQueryParameters {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  descending?: boolean;
  albumId?: number;
  type?: number;
  published?: boolean;
}
