// 彈窗公告相關類型定義

export const PopupFrequency = {
  Always: 0,          // 每次都彈
  OncePerSession: 1,  // 每個 Session 一次
  OncePerDay: 2,      // 每天一次
  OnceOnly: 3         // 只彈一次（永久記住）
} as const;

export type PopupFrequency = typeof PopupFrequency[keyof typeof PopupFrequency];

export interface PopupAnnouncement {
  id: number;
  title: string;
  content?: string;
  imageId?: number;
  imageUrl?: string;
  linkUrl?: string;
  linkTarget?: string;
  routes: string[];
  frequency: PopupFrequency;
  priority: number;
  startDate?: string;
  endDate?: string;
  showCloseButton: boolean;
  showDontShowToday: boolean;
  published: boolean;
  ordinal: number;
  createdTime: string;
  updatedTime?: string;
}

export interface PopupAnnouncementListItem {
  id: number;
  title: string;
  routes: string[];
  frequency: PopupFrequency;
  priority: number;
  startDate?: string;
  endDate?: string;
  published: boolean;
  createdTime: string;
}

export interface CreatePopupAnnouncementRequest {
  title: string;
  content?: string;
  imageId?: number;
  linkUrl?: string;
  linkTarget?: string;
  routes: string[];
  frequency?: PopupFrequency;
  priority?: number;
  startDate?: string;
  endDate?: string;
  showCloseButton?: boolean;
  showDontShowToday?: boolean;
  published?: boolean;
  ordinal?: number;
}

export interface UpdatePopupAnnouncementRequest {
  title?: string;
  content?: string;
  imageId?: number;
  linkUrl?: string;
  linkTarget?: string;
  routes?: string[];
  frequency?: PopupFrequency;
  priority?: number;
  startDate?: string;
  endDate?: string;
  showCloseButton?: boolean;
  showDontShowToday?: boolean;
  published?: boolean;
  ordinal?: number;
}

export interface PopupAnnouncementSearchParams {
  search?: string;
  published?: boolean;
  route?: string;
}
