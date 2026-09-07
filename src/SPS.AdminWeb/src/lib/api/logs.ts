import { apiClient } from '@/lib/api-client';
import type { PagedResponse} from '@/types/api';
import type {ActionLog, ApplicationLog, LogSearchParams, MailLog, MailLogDetail, MailLogSearchParams} from "@/types/logs.ts";

// ========== Log API (Legacy Compat) ==========
export const logsApi = {
  // 分頁查詢操作日誌
  async getActionLogs(
    pageIndex = 1,
    pageSize = 20,
    params?: LogSearchParams
  ): Promise<PagedResponse<ActionLog>> {
    const response = await apiClient.get('/api/Log/action', {
      params: {
        Page: pageIndex,
        PageSize: pageSize,
        Search: params?.search,
        UserId: params?.userId,
        ActionType: params?.actionType,
      },
    });
    return response.data;
  },

  // 分頁查詢申請日誌
  async getApplicationLogs(
    pageIndex = 1,
    pageSize = 20,
    params?: LogSearchParams
  ): Promise<PagedResponse<ApplicationLog>> {
    const response = await apiClient.get('/api/Log/application', {
      params: {
        Page: pageIndex,
        PageSize: pageSize,
        Search: params?.search,
        ApplicationId: params?.applicationId,
      },
    });
    return response.data;
  },

  // 分頁查詢郵件發送日誌
  async getMailLogs(
    pageIndex = 1,
    pageSize = 20,
    params?: MailLogSearchParams
  ): Promise<PagedResponse<MailLog>> {
    const response = await apiClient.get('/api/Log/mail', {
      params: {
        Page: pageIndex,
        PageSize: pageSize,
        Search: params?.search,
        MailType: params?.mailType,
        IsSuccess: params?.isSuccess,
        BounceStatus: params?.bounceStatus,
        BouncedOnly: params?.bouncedOnly,
        DateFrom: params?.dateFrom,
        DateTo: params?.dateTo,
        Descending: params?.descending,
      },
    });
    return response.data;
  },

  // 獲取操作日誌詳情
  async getActionLogById(id: number): Promise<ActionLog> {
    const response = await apiClient.get(`/api/Log/action/${id}`);
    return response.data;
  },

  // 獲取申請日誌詳情
  async getApplicationLogById(id: string): Promise<ApplicationLog> {
    const response = await apiClient.get(`/api/Log/application/${id}`);
    return response.data;
  },

  // 獲取郵件日誌詳情
  async getMailLogById(id: number): Promise<MailLogDetail> {
    const response = await apiClient.get(`/api/Log/mail/${id}`);
    return response.data;
  },

  // 導出操作日誌
  async exportActionLogs(params: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    format?: 'json' | 'csv' | 'excel';
    userId?: string;
    actionType?: string;
  }): Promise<void> {
    const response = await apiClient.get('/api/Log/action/export', {
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
        limit: params.limit,
        format: params.format || 'json',
        userId: params.userId,
        actionType: params.actionType,
      },
      responseType: 'blob',
    });

    // 從 Content-Disposition 取得檔名
    const contentDisposition = response.headers['content-disposition'];
    let filename = `action-logs.${params.format || 'json'}`;
    if (contentDisposition) {
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
      if (matches?.[1]) {
        filename = matches[1].replace(/['"]/g, '');
      }
    }

    // 下載檔案
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
