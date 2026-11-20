// 標籤與屬性（Taxonomy）相關類型定義

// ========== 一般標籤 (Tags) ==========
/**
 * 標籤類型，對應後端 `SPS.Domain.Enums.TagType`。後端標籤是一張表依類型分開
 * （公告/產品/…），建立時 `type` 必填。
 */
export const TagType = {
  News: 1,
  /** 課程類型（人才培育課程的「類型」篩選，跟公告關鍵字標籤是獨立的兩組） */
  CourseType: 5,
} as const;
export type TagType = number;

/** 對應後端 TagResponse（徽章顏色 badge* 是 2026-11 新增的，後台標籤管理設定、前台卡片套用） */
export interface Tag {
  id: number;
  type: TagType;
  name: string;
  ordinal: number;
  categoryId?: number | null;
  categoryName?: string | null;
  /** 目前有幾個項目綁了這個標籤；大於 0 時後端不允許刪除 */
  usageCount: number;
  /** 前台徽章顏色（#RRGGBB），沒設定為空：後台「分類管理／標籤管理」維護 */
  badgeColor?: string | null;
  badgeTextColor?: string | null;
  badgeBorderColor?: string | null;
  createdTime: string;
  updatedTime?: string;
}

export interface CreateTagRequest {
  type: TagType;
  name: string;
  ordinal?: number;
  categoryId?: number | null;
  /** 徽章顏色 #RRGGBB；更新時空字串＝清除（恢復前台預設樣式），不傳＝不變 */
  badgeColor?: string;
  badgeTextColor?: string;
  badgeBorderColor?: string;
}

export interface UpdateTagRequest {
  name?: string;
  ordinal?: number;
  /** 徽章顏色 #RRGGBB；更新時空字串＝清除（恢復前台預設樣式），不傳＝不變 */
  badgeColor?: string;
  badgeTextColor?: string;
  badgeBorderColor?: string;
}

// ========== 業務屬性類別 (Business Categories) ==========
export interface BusinessCategory {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  parentName?: string;
  ordinal: number;
  attributeCount: number;
  createdTime: string;
  updatedTime?: string;
}

export interface CreateBusinessCategoryRequest {
  name: string;
  description?: string;
  parentId?: number;
  ordinal?: number;
}

export interface UpdateBusinessCategoryRequest {
  name?: string;
  description?: string;
  parentId?: number;
  ordinal?: number;
}

// ========== 業務屬性 (Business Attributes) ==========
export interface BusinessAttribute {
  id: number;
  name: string;
  description?: string;
  categoryId?: number;
  categoryName?: string;
  ordinal: number;
  isRequired: boolean;
  createdTime: string;
  updatedTime?: string;
}

export interface CreateBusinessAttributeRequest {
  name: string;
  description?: string;
  categoryId?: number;
  ordinal?: number;
  isRequired?: boolean;
}

export interface UpdateBusinessAttributeRequest {
  name?: string;
  description?: string;
  categoryId?: number;
  ordinal?: number;
  isRequired?: boolean;
}

// ========== 產品類別 (Product Categories) ==========
export interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  parentName?: string;
  ordinal: number;
  productCount: number;
  createdTime: string;
  updatedTime?: string;
}

export interface CreateProductCategoryRequest {
  name: string;
  description?: string;
  parentId?: number;
  ordinal?: number;
}

export interface UpdateProductCategoryRequest {
  name?: string;
  description?: string;
  parentId?: number;
  ordinal?: number;
}

// ========== 產品屬性 (Product Attributes) ==========
export interface ProductAttribute {
  id: number;
  name: string;
  description?: string;
  categoryId?: number;
  categoryName?: string;
  ordinal: number;
  isRequired: boolean;
  createdTime: string;
  updatedTime?: string;
}

export interface CreateProductAttributeRequest {
  name: string;
  description?: string;
  categoryId?: number;
  ordinal?: number;
  isRequired?: boolean;
}

export interface UpdateProductAttributeRequest {
  name?: string;
  description?: string;
  categoryId?: number;
  ordinal?: number;
  isRequired?: boolean;
}
