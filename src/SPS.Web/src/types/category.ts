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
}

export interface UpdateCategoryRequest {
  type?: number;
  name?: string;
  published?: boolean;
  ordinal?: number;
  parentId?: number;
  remark?: string;
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
