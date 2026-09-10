// 影片相關類型定義

/**
 * 影片回應資料
 */
export interface VideoResponse {
  id: number;
  name?: string;
  contentType?: string;
  uri?: string;
  thumbnailUri?: string;
  linkUrl?: string;
  /** 前台要不要用站內燈箱嵌入播放，關掉的話直接連到 linkUrl／uri 原始來源（開新分頁）——CSP 沒放行嵌入來源網域時可以個別關掉這支影片 */
  playOnSite: boolean;
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
  createdTime: string;
  updatedTime: string;
}

/**
 * 影片列表項回應
 */
export interface VideoListItemResponse extends VideoResponse {}

/**
 * 創建影片請求
 */
export interface CreateVideoRequest {
  name: string;
  contentType?: string;
  uri: string;
  thumbnailUri?: string;
  linkUrl?: string;
  playOnSite: boolean;
  published: boolean;
  startDate?: string;
  endDate?: string;
  ordinal: number;
  height: number;
  width: number;
  dpi: number;
  remark?: string;
  albumId?: number;
}

/**
 * 更新影片請求
 */
export interface UpdateVideoRequest {
  name?: string;
  contentType?: string;
  uri?: string;
  thumbnailUri?: string;
  linkUrl?: string;
  playOnSite?: boolean;
  published?: boolean;
  startDate?: string;
  endDate?: string;
  ordinal?: number;
  height?: number;
  width?: number;
  dpi?: number;
  remark?: string;
  albumId?: number;
}

/**
 * 影片查詢參數
 */
export interface VideoQueryParameters {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  descending?: boolean;
  albumId?: number;
  published?: boolean;
}
