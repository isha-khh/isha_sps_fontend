import { apiClient } from '@/lib/api-client';
import type { Inquiry, InquiryCounts, InquirySearchParams, InquiryStatus, StaffNotificationSettings } from '@/types/inquiry';
import type { PagedResponse } from '@/types/api';

// ========== 詢問單 API（前台各個「留下資料等人回覆」的表單送到這裡）==========
export const inquiriesApi = {
  async getInquiries(page = 1, pageSize = 20, params?: InquirySearchParams): Promise<PagedResponse<Inquiry>> {
    const response = await apiClient.get('/api/Inquiry', {
      params: {
        Page: page,
        PageSize: pageSize,
        Type: params?.type,
        Status: params?.status,
        Search: params?.search,
        TargetType: params?.targetType,
        TargetKey: params?.targetKey,
      },
    });
    return response.data;
  },

  async getCounts(): Promise<InquiryCounts> {
    const response = await apiClient.get('/api/Inquiry/counts');
    return response.data;
  },

  // 某一類對象底下每個項目收到的詢問單數量（key 是項目編號），列表的「回應數量」用
  async getCountsByTarget(targetType: string): Promise<Record<string, number>> {
    const response = await apiClient.get('/api/Inquiry/counts-by-target', { params: { targetType } });
    return response.data;
  },

  // 匯出詢問單為 Excel（可只匯出某一個項目的回應）
  async exportToExcel(params: InquirySearchParams): Promise<void> {
    const response = await apiClient.get('/api/Inquiry/export', {
      params: { Type: params.type, Status: params.status, Search: params.search, TargetType: params.targetType, TargetKey: params.targetKey },
      responseType: 'blob',
    });
    const blob = new Blob([response.data as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const date = new Date().toLocaleDateString('zh-TW').replace(/\//g, '');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${params.targetKey ? '回應' : '詢問單'}_${date}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  },

  async update(id: string, data: { status: InquiryStatus; handlerNote?: string }): Promise<Inquiry> {
    const response = await apiClient.put(`/api/Inquiry/${id}`, data);
    return response.data;
  },

  // 回覆會員：寫進該會員的收件匣（只有登入會員送出的詢問單可以），可選擇同時寄信到單上的信箱
  async reply(id: string, data: { message: string; alsoEmail: boolean }): Promise<Inquiry> {
    const response = await apiClient.post(`/api/Inquiry/${id}/reply`, data);
    return response.data;
  },

  async getNotificationSettings(): Promise<StaffNotificationSettings> {
    const response = await apiClient.get('/api/Inquiry/notification-settings');
    return response.data;
  },

  async updateNotificationSettings(settings: StaffNotificationSettings): Promise<StaffNotificationSettings> {
    const response = await apiClient.put('/api/Inquiry/notification-settings', settings);
    return response.data;
  },

  async sendTestNotification(): Promise<{ sent: number }> {
    const response = await apiClient.post('/api/Inquiry/notification-settings/test');
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/api/Inquiry/${id}`);
  },
};
