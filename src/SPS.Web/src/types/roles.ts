import { apiClient } from '@/lib/api-client';

export interface PermissionDto {
  value: number;
  name: string;
  description: string;
  group: string;
}

export interface RoleDto {
  id: string;
  name: string;
  description: string;
  permissions: number;
  permissionNames?: string[];
  userCount: number;
  isSystem: boolean;
  createdTime: string;
  updatedTime?: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissions: number;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: number;
}

export const rolesApi = {
  // 獲取所有角色
  async getRoles(): Promise<RoleDto[]> {
    const response = await apiClient.get('/api/admin/roles');
    return response.data;
  },

  // 獲取所有權限定義
  async getPermissions(): Promise<PermissionDto[]> {
    const response = await apiClient.get('/api/admin/roles/permissions');
    return response.data;
  },

  // 獲取角色詳情
  async getRoleById(id: string): Promise<RoleDto> {
    const response = await apiClient.get(`/api/admin/roles/${id}`);
    return response.data;
  },

  // 創建角色
  async createRole(request: CreateRoleRequest): Promise<string> {
    const response = await apiClient.post('/api/admin/roles', request);
    // Returns the ID of the created role
    return response.data;
  },

  // 更新角色
  async updateRole(id: string, request: UpdateRoleRequest): Promise<void> {
    await apiClient.put(`/api/admin/roles/${id}`, request);
  },

  // 刪除角色
  async deleteRole(id: string): Promise<void> {
    await apiClient.delete(`/api/admin/roles/${id}`);
  },
};
