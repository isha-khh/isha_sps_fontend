// 標籤與屬性（Taxonomy）相關類型定義

// ========== 一般標籤 (Tags) ==========
export interface Tag {
  id: number;
  name: string;
  description?: string;
  color?: string;
  usageCount: number;
  createdTime: string;
  updatedTime?: string;
}

export interface CreateTagRequest {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateTagRequest {
  name?: string;
  description?: string;
  color?: string;
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
