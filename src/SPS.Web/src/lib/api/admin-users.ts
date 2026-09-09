import { apiClient } from '@/lib/api-client';
import type {
  AdminUser,
  AdminUserParams,
  CreateAdminUserRequest,
  PaginatedResult,
  UpdateAdminPermissionsRequest, UpdateAdminUserStatusRequest
} from '@/types/admin-user';

export const adminUserApi = {
  /**
   * 獲取後台所有使用者列表 (含分頁)
   * GET /api/admin/users
   */
  async getUsers(params: AdminUserParams): Promise<PaginatedResult<AdminUser>> {
    try {
      const response = await apiClient.get<PaginatedResult<AdminUser>>('/api/admin/users', {
        params: {
          Search: params.search,
          Page: params.page,
          PageSize: params.pageSize,
          SortBy: params.sortBy,
          Descending: params.descending,
        },
      });

      return response.data;
    } catch (error) {
      console.error('獲取使用者列表失敗:', error);
      throw error;
    }
  },

  /**
   * 獲取後台使用者詳情
   * GET /api/admin/users/{id}
   */
  async getById(id: string): Promise<AdminUser> {
    try {
      const response = await apiClient.get<AdminUser>(`/api/admin/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch admin user:', error);
      throw error;
    }
  },

  /**
   * 創建後台使用者
   * POST /api/admin/users
   */
  async create(request: CreateAdminUserRequest): Promise<string> {
    try {
      const response = await apiClient.post<string>('/api/admin/users', request);
      return response.data;
    } catch (error) {
      console.error('Failed to create admin user:', error);
      throw error;
    }
  },

  /**
   * 更新使用者權限（角色）
   * PUT /api/admin/users/{id}/permissions
   */
  async updatePermissions(id: string, request: UpdateAdminPermissionsRequest): Promise<void> {
    try {
      await apiClient.put(`/api/admin/users/${id}/permissions`, request);
    } catch (error) {
      console.error('Failed to update admin user permissions:', error);
      throw error;
    }
  },

  /**
   * 更新使用者狀態（停用/啟用）
   * PUT /api/admin/users/{id}/status
   */
  async updateStatus(id: string, request: UpdateAdminUserStatusRequest): Promise<void> {
    try {
      await apiClient.put(`/api/admin/users/${id}/status`, request);
    } catch (error) {
      console.error('Failed to update admin user status:', error);
      throw error;
    }
  },
};
