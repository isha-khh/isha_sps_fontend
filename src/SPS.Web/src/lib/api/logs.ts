import { apiClient } from '@/lib/api-client';
import type { PagedResponse} from '@/types/api';
import type {ActionLog, ApplicationLog, LogSearchParams, MailLog} from "@/types/logs";

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
    params?: LogSearchParams
  ): Promise<PagedResponse<MailLog>> {
    const response = await apiClient.get('/api/Log/mail', {
      params: {
        Page: pageIndex,
        PageSize: pageSize,
        Search: params?.search,
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
};
