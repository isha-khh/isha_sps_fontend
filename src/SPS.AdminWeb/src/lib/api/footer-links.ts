import { apiClient } from '@/lib/api-client';

/**
 * 前台頁尾（Footer）的外部連結設定。欄位留空＝前台不顯示該項目。
 * 對應後端 `FooterLinksSettingsDto`。
 */
export interface FooterLinksSettings {
  functionZoneUrl: string;
  lineUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  youTubeUrl: string;
  threadsUrl: string;
  podcastUrl: string;
  accessibilityBadgeUrl: string;
  idaUrl: string;
  ishaUrl: string;
}

export const footerLinksApi = {
  /**
   * 取得頁尾連結設定
   * GET /api/settings/footer-links
   */
  async get(): Promise<FooterLinksSettings> {
    const response = await apiClient.get<FooterLinksSettings>('/api/settings/footer-links');
    return response.data;
  },

  /**
   * 更新頁尾連結設定
   * PUT /api/settings/footer-links
   *
   * 網址不合法（不是 http／https）時後端回 400 `{ error }`，由呼叫端顯示。
   */
  async update(settings: FooterLinksSettings): Promise<void> {
    await apiClient.put('/api/settings/footer-links', settings);
  },
};
