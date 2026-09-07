import { apiClient } from '../api-client';
import type {
  HttpSecuritySettings,
  NginxConfigExport,
  SecurityTemplateName,
} from '@/types/http-security';

/**
 * 獲取 HTTP 安全性設定
 */
export async function getHttpSecuritySettings(): Promise<HttpSecuritySettings> {
  const response = await apiClient.get<HttpSecuritySettings>('/api/settings/http-security');
  return response.data;
}

/**
 * 更新 HTTP 安全性設定
 */
export async function updateHttpSecuritySettings(
  settings: HttpSecuritySettings
): Promise<{ message: string }> {
  const response = await apiClient.put<{ message: string }>('/api/settings/http-security', settings);
  return response.data;
}

/**
 * 套用安全性模板
 */
export async function applySecurityTemplate(
  templateName: SecurityTemplateName
): Promise<{ message: string; settings: HttpSecuritySettings }> {
  const response = await apiClient.post<{ message: string; settings: HttpSecuritySettings }>(
    `/api/settings/http-security/apply-template/${templateName}`
  );
  return response.data;
}

/**
 * 強制重新產生 Nginx 設定並觸發重新載入
 */
export async function reloadNginxConfig(): Promise<{ message: string; reloaded: boolean; generatedAt?: string }> {
  const response = await apiClient.post<{ message: string; reloaded: boolean; generatedAt?: string }>(
    '/api/settings/http-security/reload-nginx'
  );
  return response.data;
}

/**
 * 匯出 Nginx 設定
 */
export async function exportNginxConfig(): Promise<NginxConfigExport> {
  const response = await apiClient.get<NginxConfigExport>('/api/settings/http-security/export/nginx');
  return response.data;
}

/**
 * 下載 Nginx 設定檔
 */
export async function downloadNginxConfig(): Promise<void> {
  const response = await apiClient.get('/api/settings/http-security/export/nginx/download', {
    responseType: 'blob',
  });

  // 建立下載連結
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'security-headers.conf');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
