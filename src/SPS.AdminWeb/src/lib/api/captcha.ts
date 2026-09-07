import { apiClient } from '@/lib/api-client';
import type {
  CaptchaGenerateResponse,
  CaptchaVerifyRequest,
  CaptchaPublicSettings,
  CaptchaSettings,
} from '@/types/captcha';

export const captchaApi = {
  // ==================== 公開 API ====================

  /**
   * 獲取指定場景的 CAPTCHA 設定
   * @param scenario 場景名稱（member-login, member-register, admin-login, forgot-password）
   */
  async getPublicSettings(scenario: string): Promise<CaptchaPublicSettings> {
    try {
      const response = await apiClient.get('/api/captcha/settings', {
        params: { scenario },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch captcha settings:', error);
      throw error;
    }
  },

  /**
   * 生成圖片驗證碼
   */
  async generate(): Promise<CaptchaGenerateResponse> {
    try {
      const response = await apiClient.post('/api/captcha/generate');
      return response.data;
    } catch (error) {
      console.error('Failed to generate captcha:', error);
      throw error;
    }
  },

  /**
   * 獲取音訊驗證碼 URL
   * @param captchaId 驗證碼 ID
   */
  getAudioUrl(captchaId: string): string {
    const baseUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || '');
    return `${baseUrl}/api/captcha/audio/${captchaId}`;
  },

  /**
   * 驗證 CAPTCHA
   */
  async verify(request: CaptchaVerifyRequest): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post('/api/captcha/verify', request);
      return response.data;
    } catch (error) {
      console.error('Failed to verify captcha:', error);
      throw error;
    }
  },

  // ==================== 管理 API（需 SuperAdmin）====================

  /**
   * 獲取 CAPTCHA 設定（管理用）
   */
  async getSettings(): Promise<CaptchaSettings> {
    try {
      const response = await apiClient.get('/api/settings/captcha');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch captcha admin settings:', error);
      throw error;
    }
  },

  /**
   * 更新 CAPTCHA 設定（管理用）
   */
  async updateSettings(settings: CaptchaSettings): Promise<void> {
    try {
      await apiClient.put('/api/settings/captcha', settings);
    } catch (error) {
      console.error('Failed to update captcha settings:', error);
      throw error;
    }
  },
};
