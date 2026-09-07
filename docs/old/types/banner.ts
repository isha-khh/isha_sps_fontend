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
  createdTime: string;
  updatedTime: string;
}

export interface CreateBannerRequest {
  name: string;
  contentType?: string;
  uri: string;
  linkUrl?: string;
  linkTarget?: '_blank' | '_self';
  remark?: string;
  positionId?: number;
}

export interface UpdateBannerRequest {
  name?: string;
  contentType?: string;
  uri?: string;
  linkUrl?: string;
  linkTarget?: '_blank' | '_self';
  remark?: string;
  positionId?: number;
}
