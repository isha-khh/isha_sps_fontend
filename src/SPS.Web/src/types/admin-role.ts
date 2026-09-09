// Admin Role related types based on backend DTOs

export interface RoleDto {
  id: string;
  name: string;
  description?: string;
  permissions: number;
  createdTime: string;
  updatedTime: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissions: number;
}

export interface UpdateRoleRequest {
  name: string;
  description?: string;
  permissions: number;
}

export interface PermissionDto {
  name: string;
  value: number;
  description: string;
  group: string;
}

export interface PermissionsListResponse {
  permissions: PermissionDto[];
}
