import { apiClient } from '@/lib/api-client';
import type {
  RoleDto,
  CreateRoleRequest,
  UpdateRoleRequest,
  PermissionDto,
} from '@/types/admin-role';

export const adminRolesApi = {
  /**
   * 獲取所有角色
   * GET /api/admin/roles
   */
  async getList(): Promise<RoleDto[]> {
    try {
      const response = await apiClient.get<RoleDto[]>('/api/admin/roles');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      throw error;
    }
  },

  /**
   * 獲取角色詳情
   * GET /api/admin/roles/{id}
   */
  async getById(id: string): Promise<RoleDto> {
    try {
      const response = await apiClient.get<RoleDto>(`/api/admin/roles/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch role details:', error);
      throw error;
    }
  },

  /**
   * 獲取所有權限定義
   * GET /api/admin/roles/permissions
   */
  async getPermissions(): Promise<PermissionDto[]> {
    try {
      const response = await apiClient.get<PermissionDto[]>('/api/admin/roles/permissions');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      throw error;
    }
  },

  /**
   * 創建角色
   * POST /api/admin/roles
   */
  async create(request: CreateRoleRequest): Promise<RoleDto> {
    try {
      const response = await apiClient.post<RoleDto>('/api/admin/roles', request);
      return response.data;
    } catch (error) {
      console.error('Failed to create role:', error);
      throw error;
    }
  },

  /**
   * 更新角色
   * PUT /api/admin/roles/{id}
   */
  async update(id: string, request: UpdateRoleRequest): Promise<RoleDto> {
    try {
      const response = await apiClient.put<RoleDto>(`/api/admin/roles/${id}`, request);
      return response.data;
    } catch (error) {
      console.error('Failed to update role:', error);
      throw error;
    }
  },

  /**
   * 刪除角色
   * DELETE /api/admin/roles/{id}
   */
  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/admin/roles/${id}`);
    } catch (error) {
      console.error('Failed to delete role:', error);
      throw error;
    }
  },
};
