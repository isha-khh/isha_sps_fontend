export interface ContentSettings {
  guestCanViewBusinessDetail: boolean;
  showBusinessListTags: boolean;
  showBusinessListIntroduction: boolean;
  businessListIntroductionMaxLength: number;
}

/**
 * 取得公開內容設定（SSR 用，直連後端）
 */
export async function getContentSettingsSSR(): Promise<ContentSettings> {
  const apiUrl = process.env.API_URL || 'http://backend:8080';
  try {
    const res = await fetch(`${apiUrl}/api/settings/content/public`, {
      cache: 'no-store',
    });
    if (!res.ok) return { guestCanViewBusinessDetail: true, showBusinessListTags: true, showBusinessListIntroduction: false, businessListIntroductionMaxLength: 100 };
    return (await res.json()) as ContentSettings;
  } catch {
    return { guestCanViewBusinessDetail: true, showBusinessListTags: true, showBusinessListIntroduction: false, businessListIntroductionMaxLength: 100 };
  }
}
