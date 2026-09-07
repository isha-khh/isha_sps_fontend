// 屬性相關類型定義

/**
 * 屬性類型枚舉
 */
export const AttributeType = {
  Business: 1,
  Product: 2,
} as const;

export type AttributeType = (typeof AttributeType)[keyof typeof AttributeType];

/**
 * 數據模式枚舉
 */
export const DataMode= {
  Normal:0,
  Draft:1,
  Archived:2,
  Deleted:3,
} as const;

export type DataMode = (typeof DataMode)[keyof typeof DataMode];

/**
 * 屬性 DTO
 */
export interface AttributeDto {
  id: number;
  categoryId?: number;
  categoryName?: string;
  code: string;
  name: string;
  description?: string;
  selectable: boolean;
  multiple: boolean;
  isRequired: boolean;
  ordinal: number;
  remark?: string;
  type: AttributeType;
  dataMode: DataMode;
  createdTime: string;
  updatedTime?: string;
}

/**
 * 創建屬性請求
 */
export interface CreateAttributeRequest {
  categoryId?: number;
  code: string;
  name: string;
  description?: string;
  selectable: boolean;
  multiple: boolean;
  required: boolean;
  ordinal?: number;
  remark?: string;
  type: AttributeType;
}

/**
 * 更新屬性請求
 */
export interface UpdateAttributeRequest {
  categoryId?: number;
  code?: string;
  name?: string;
  description?: string;
  selectable?: boolean;
  multiple?: boolean;
  required?: boolean;
  ordinal?: number;
  remark?: string;
  type?: AttributeType;
}

/**
 * 屬性查詢參數
 */
export interface AttributeQueryParameters {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  descending?: boolean;
  categoryId?: number;
  type?: AttributeType;
}
