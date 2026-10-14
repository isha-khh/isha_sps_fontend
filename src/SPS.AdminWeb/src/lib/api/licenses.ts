import { apiClient } from '@/lib/api-client';
import type {
  LicenseDetail,
  LicenseEvent,
  LicenseListItem,
  LicenseSettings,
  LicenseStats,
  RegisterSigningKeyRequest,
  SigningKey,
  UpdateLicenseRequest,
  UpdateSigningKeyRequest,
} from '@/types/license';

interface Paged<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// ========== XR 軟體授權（後台）==========
export const licensesApi = {
  async getStats(): Promise<LicenseStats> {
    return (await apiClient.get('/api/admin/licenses/stats')).data;
  },

  async list(page = 1, pageSize = 20, params?: { search?: string; status?: string }): Promise<Paged<LicenseListItem>> {
    return (await apiClient.get('/api/admin/licenses', { params: { Page: page, PageSize: pageSize, Search: params?.search, Status: params?.status } })).data;
  },

  async get(id: string): Promise<LicenseDetail> {
    return (await apiClient.get(`/api/admin/licenses/${id}`)).data;
  },

  async events(id: string, page = 1, pageSize = 30): Promise<Paged<LicenseEvent>> {
    return (await apiClient.get(`/api/admin/licenses/${id}/events`, { params: { page, pageSize } })).data;
  },

  async update(id: string, data: UpdateLicenseRequest): Promise<LicenseDetail> {
    return (await apiClient.put(`/api/admin/licenses/${id}`, data)).data;
  },

  /** suspend／restore／revoke（撤銷必填原因，撤銷後不能恢復） */
  async setStatus(id: string, action: 'suspend' | 'restore' | 'revoke', reason?: string): Promise<LicenseDetail> {
    return (await apiClient.post(`/api/admin/licenses/${id}/status`, { action, reason })).data;
  },

  async revokeDevice(id: string, activationId: string): Promise<LicenseDetail> {
    return (await apiClient.post(`/api/admin/licenses/${id}/devices/${activationId}/revoke`)).data;
  },

  async invalidateKey(id: string): Promise<LicenseDetail> {
    return (await apiClient.post(`/api/admin/licenses/${id}/invalidate-key`)).data;
  },

  async getKeys(): Promise<SigningKey[]> {
    return (await apiClient.get('/api/admin/licenses/keys')).data;
  },

  async registerKey(data: RegisterSigningKeyRequest): Promise<SigningKey> {
    return (await apiClient.post('/api/admin/licenses/keys', data)).data;
  },

  async updateKey(kid: string, data: UpdateSigningKeyRequest): Promise<SigningKey> {
    return (await apiClient.put(`/api/admin/licenses/keys/${encodeURIComponent(kid)}`, data)).data;
  },

  async getSettings(): Promise<LicenseSettings> {
    return (await apiClient.get('/api/admin/licenses/settings')).data;
  },

  async updateSettings(data: LicenseSettings): Promise<LicenseSettings> {
    return (await apiClient.put('/api/admin/licenses/settings', data)).data;
  },
};

/** 後端錯誤訊息：後台授權端點回 `{ error: 訊息, code }` */
export function licenseErrorMessage(error: unknown, fallback: string): string {
  return (error as { response?: { data?: { error?: string } } })?.response?.data?.error || fallback;
}
