

// 定義角色結構 (對應 JSON 中的 roles 陣列)
export interface AdminRole {
  id: string;
  name: string;
  permissions: number;
}
export interface AdminUserParams {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  descending?: boolean;
}

export interface CreateAdminUserRequest {
  name: string;
  account: string;
  password: string;
  email?: string;
  roleIds: string[];
}

export interface UpdateAdminPermissionsRequest {
  roleIds: string[];
}

export interface UpdateAdminUserStatusRequest {
  status: number;
}
// 定義使用者結構 (對應 JSON 中的 items 陣列內容)
export interface AdminUser {
  id: string;
  name: string;
  account: string;
  email: string;
  status: number; // 0 或 1，建議前端可以定義 Enum 對應狀態
  createdTime: string;
  lastLoginTime: string | null; // JSON 中有 null，所以必須允許 null
  roles: AdminRole[];
  permissions: number;
}

// 定義通用的分頁回應結構 (Generic)
// 這樣以後其他 API 有分頁也可以共用
export interface PaginatedResult<T> {
  items: T[]; // 資料列表
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}


export interface GetAdminUserByIdRequest {
    id:string;
}

export interface UpdateAdminUserPermissionsRequest {
    id:string;
}
