// Category related types based on backend DTOs

export interface CategoryResponse {
  id: number;
  type: number;
  name?: string;
  published: boolean;
  ordinal: number;
  parentId?: number;
  parentName?: string;
  hasChild: boolean;
  remark?: string;
  /** 前台徽章顏色（#RRGGBB），沒設定為空：後台「分類管理／標籤管理」維護 */
  badgeColor?: string | null;
  badgeTextColor?: string | null;
  badgeBorderColor?: string | null;
  createdTime: string;
  updatedTime?: string;
}

export interface CreateCategoryRequest {
  type: number;
  name: string;
  published?: boolean;
  ordinal?: number;
  parentId?: number;
  remark?: string;
  /** 徽章顏色 #RRGGBB；更新時空字串＝清除（恢復前台預設樣式），不傳＝不變 */
  badgeColor?: string;
  badgeTextColor?: string;
  badgeBorderColor?: string;
}

export interface UpdateCategoryRequest {
  type?: number;
  name?: string;
  published?: boolean;
  ordinal?: number;
  parentId?: number;
  remark?: string;
  /** 徽章顏色 #RRGGBB；更新時空字串＝清除（恢復前台預設樣式），不傳＝不變 */
  badgeColor?: string;
  badgeTextColor?: string;
  badgeBorderColor?: string;
}

export interface CategoryTreeNode {
  id: number;
  type: number;
  name?: string;
  published: boolean;
  ordinal: number;
  parentId?: number;
  hasChild: boolean;
  children: CategoryTreeNode[];
}

export interface CategoryQueryParams {
  type?: number;
  parentId?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}
