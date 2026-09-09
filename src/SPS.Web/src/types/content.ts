// 內容管理相關類型定義

// ========== 橫幅 (Banners) ==========
export interface Banner {
  id: number;
  name: string;
  contentType?: string;
  uri: string;
  linkUrl?: string;
  remark?: string;
  positionId?: number;
  positionName?: string;
  viewCount: number;
  clickCount: number;
  createdTime: string;
  updatedTime?: string;
}

export interface CreateBannerRequest {
  name: string;
  contentType?: string;
  uri: string;
  linkUrl?: string;
  remark?: string;
  positionId?: number;
}

export interface UpdateBannerRequest {
  name?: string;
  contentType?: string;
  uri?: string;
  linkUrl?: string;
  remark?: string;
  positionId?: number;
}

// ========== 相關連結 (Links) ==========
export interface Link {
  id: number;
  title: string;
  url: string;
  description?: string;
  icon?: string;
  ordinal: number;
  isActive: boolean;
  openInNewTab: boolean;
  createdTime: string;
  updatedTime?: string;
}

export interface CreateLinkRequest {
  title: string;
  url: string;
  description?: string;
  icon?: string;
  ordinal?: number;
  isActive?: boolean;
  openInNewTab?: boolean;
}

export interface UpdateLinkRequest {
  title?: string;
  url?: string;
  description?: string;
  icon?: string;
  ordinal?: number;
  isActive?: boolean;
  openInNewTab?: boolean;
}

// ========== 網頁 (Pages) ==========
export interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  isPublished: boolean;
  createdTime: string;
  updatedTime?: string;
}

export interface CreatePageRequest {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  isPublished?: boolean;
}

export interface UpdatePageRequest {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  isPublished?: boolean;
}

// ========== 信件樣板 (Email Templates) ==========
export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  content: string;
  description?: string;
  variables?: string[];
  isActive: boolean;
  createdTime: string;
  updatedTime?: string;
}

export interface CreateEmailTemplateRequest {
  name: string;
  subject: string;
  content: string;
  description?: string;
  variables?: string[];
  isActive?: boolean;
}

export interface UpdateEmailTemplateRequest {
  name?: string;
  subject?: string;
  content?: string;
  description?: string;
  variables?: string[];
  isActive?: boolean;
}

// ========== 相簿 (Albums) ==========
export interface Album {
  id: number;
  number?: string;
  title: string;
  published: boolean;
  startDate?: string;
  endDate?: string;
  ordinal: number;
  coverId?: number;
  coverUri?: string;
  pictureCount: number;
  videoCount: number;
  createdTime: string;
  updatedTime?: string;
}

export interface CreateAlbumRequest {
  number?: string;
  title: string;
  published: boolean;
  startDate?: string;
  endDate?: string;
  ordinal: number;
  coverId?: number;
}

export interface UpdateAlbumRequest {
  number?: string;
  title?: string;
  published?: boolean;
  startDate?: string;
  endDate?: string;
  ordinal?: number;
  coverId?: number;
}

export interface AlbumImage {
  id: number;
  albumId: number;
  imageUrl: string;
  title?: string;
  description?: string;
  ordinal: number;
  createdTime: string;
}

export interface CreateAlbumImageRequest {
  albumId: number;
  imageUrl: string;
  title?: string;
  description?: string;
  ordinal?: number;
}
