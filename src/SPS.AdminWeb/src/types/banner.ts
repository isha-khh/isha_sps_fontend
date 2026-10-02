// Banner related types based on backend DTOs

export interface BannerResponse {
  id: number;
  name?: string;
  contentType?: string;
  uri?: string;
  linkUrl?: string;
  linkTarget?: '_blank' | '_self';
  clickCount: number;
  viewCount: number;
  remark?: string;
  positionId?: number;
  positionName?: string;
  /** 以下是首頁主視覺（home-hero）用的文案欄位，一般輪播圖不需要 */
  title?: string;
  subtitle?: string;
  /** 換行代表分成多行顯示 */
  description?: string;
  buttonText?: string;
  secondaryButtonText?: string;
  secondaryLinkUrl?: string;
  /** 同一版位內的排序，小的在前 */
  ordinal: number;
  /** 上架開始時間（沒填＝立即上架） */
  startDate?: string | null;
  /** 上架結束時間（沒填＝不下架） */
  endDate?: string | null;
  /** 沒上架的 Banner 前台不會顯示 */
  published: boolean;
  createdTime: string;
  updatedTime: string;
}

/** 固定版位（由 migration 預建），後台下拉選單用 */
export interface BannerPositionResponse {
  id: number;
  code: string;
  name: string;
  width: number;
  height: number;
  remark?: string;
}

/** 版位代碼，對應前台實際讀取的位置 */
export const BannerPositionCode = {
  HomeHero: 'home-hero',
  NewsTop: 'news-top',
} as const;

export interface CreateBannerRequest {
  name: string;
  contentType?: string;
  uri: string;
  linkUrl?: string;
  linkTarget?: '_blank' | '_self';
  remark?: string;
  positionId?: number;
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  secondaryButtonText?: string;
  secondaryLinkUrl?: string;
  ordinal?: number;
  startDate?: string | null;
  endDate?: string | null;
  published?: boolean;
}

/**
 * 更新請求。`positionId`、`startDate`、`endDate` 後端是「以請求為準」：沒帶＝清除，
 * 不是不更新（沒指定版位／立即上架／不下架本身就是有意義的狀態）。
 */
export type UpdateBannerRequest = Partial<CreateBannerRequest>;
