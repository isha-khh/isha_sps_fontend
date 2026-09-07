import { apiClient } from '@/lib/api-client';
import type {
  EmailSettings,
  GoogleAnalyticsSettings,
  FileStorageSettings,
  SecuritySettings,
  PasswordPolicySettings,
  EmailTemplate,
  EmailTemplateSettings,
  EmailTemplatePreviewRequest,
  EmailTemplateTestRequest,
  EmailTemplatePreviewResponse,
  EmailLayoutSettings,
  Fido2Settings,
  BounceMailSettings,
  BounceProcessingResult,
  ContentSettings,
  ProTrackSettings,
  MembershipGuideSettings,
  EmbeddingSettings,
  EmbeddingTestResult,
} from '@/types/settings';

export const settingsApi = {
  // Email Settings
  async getEmailSettings(): Promise<EmailSettings> {
    try {
      const response = await apiClient.get('/api/settings/email');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch email settings:', error);
      throw error;
    }
  },

  async updateEmailSettings(settings: EmailSettings): Promise<void> {
    try {
      await apiClient.put('/api/settings/email', settings);
    } catch (error) {
      console.error('Failed to update email settings:', error);
      throw error;
    }
  },

  // Google Analytics Settings
  async getGoogleAnalyticsSettings(): Promise<GoogleAnalyticsSettings> {
    try {
      const response = await apiClient.get('/api/settings/google-analytics');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch google analytics settings:', error);
      throw error;
    }
  },

  async updateGoogleAnalyticsSettings(settings: GoogleAnalyticsSettings): Promise<void> {
    try {
      await apiClient.put('/api/settings/google-analytics', settings);
    } catch (error) {
      console.error('Failed to update google analytics settings:', error);
      throw error;
    }
  },

  // File Storage Settings
  async getFileStorageSettings(): Promise<FileStorageSettings> {
    try {
      const response = await apiClient.get('/api/settings/file-storage');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch file storage settings:', error);
      throw error;
    }
  },

  async updateFileStorageSettings(settings: FileStorageSettings): Promise<void> {
    try {
      await apiClient.put('/api/settings/file-storage', settings);
    } catch (error) {
      console.error('Failed to update file storage settings:', error);
      throw error;
    }
  },

  // ==================== Security Settings ====================

  async getSecuritySettings(): Promise<SecuritySettings> {
    try {
      const response = await apiClient.get('/api/settings/security');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch security settings:', error);
      throw error;
    }
  },

  async updateSecuritySettings(settings: SecuritySettings): Promise<void> {
    try {
      await apiClient.put('/api/settings/security', settings);
    } catch (error) {
      console.error('Failed to update security settings:', error);
      throw error;
    }
  },

  // ==================== Password Policy Settings ====================

  async getPasswordPolicySettings(): Promise<PasswordPolicySettings> {
    try {
      const response = await apiClient.get('/api/settings/password-policy');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch password policy settings:', error);
      throw error;
    }
  },

  async updatePasswordPolicySettings(settings: PasswordPolicySettings): Promise<void> {
    try {
      await apiClient.put('/api/settings/password-policy', settings);
    } catch (error) {
      console.error('Failed to update password policy settings:', error);
      throw error;
    }
  },

  // ==================== Email Templates ====================

  async getEmailTemplates(): Promise<EmailTemplateSettings> {
    try {
      const response = await apiClient.get('/api/settings/email-templates');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch email templates:', error);
      throw error;
    }
  },

  async getEmailTemplate(key: string): Promise<EmailTemplate> {
    try {
      const response = await apiClient.get(`/api/settings/email-templates/${key}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch email template:', error);
      throw error;
    }
  },

  async updateEmailTemplate(key: string, template: Partial<EmailTemplate>): Promise<void> {
    try {
      await apiClient.put(`/api/settings/email-templates/${key}`, template);
    } catch (error) {
      console.error('Failed to update email template:', error);
      throw error;
    }
  },

  async previewEmailTemplate(key: string, request: EmailTemplatePreviewRequest): Promise<EmailTemplatePreviewResponse> {
    try {
      const response = await apiClient.post(`/api/settings/email-templates/${key}/preview`, request);
      return response.data;
    } catch (error) {
      console.error('Failed to preview email template:', error);
      throw error;
    }
  },

  async testEmailTemplate(key: string, request: EmailTemplateTestRequest): Promise<void> {
    try {
      await apiClient.post(`/api/settings/email-templates/${key}/test`, request);
    } catch (error) {
      console.error('Failed to send test email:', error);
      throw error;
    }
  },

  // ==================== Email Layout Settings ====================

  async getEmailLayoutSettings(): Promise<EmailLayoutSettings> {
    const response = await apiClient.get('/api/settings/email-layout');
    return response.data;
  },

  async updateEmailLayoutSettings(settings: EmailLayoutSettings): Promise<void> {
    await apiClient.put('/api/settings/email-layout', settings);
  },

  // ==================== FIDO2 Passkey 設定 ====================

  async getFido2Settings(): Promise<Fido2Settings> {
    const response = await apiClient.get('/api/settings/fido2');
    return response.data;
  },

  async updateFido2Settings(settings: Fido2Settings): Promise<void> {
    await apiClient.put('/api/settings/fido2', settings);
  },

  // ==================== 退信處理設定 ====================

  async getBounceMailSettings(): Promise<BounceMailSettings> {
    const response = await apiClient.get('/api/settings/bounce-mail');
    return response.data;
  },

  async updateBounceMailSettings(settings: BounceMailSettings): Promise<void> {
    await apiClient.put('/api/settings/bounce-mail', settings);
  },

  async testImapConnection(settings: BounceMailSettings): Promise<{ success: boolean; message: string; messageCount?: number }> {
    const response = await apiClient.post('/api/settings/bounce-mail/test-connection', settings);
    return response.data;
  },

  async processBounces(): Promise<BounceProcessingResult> {
    const response = await apiClient.post('/api/settings/bounce-mail/process');
    return response.data;
  },

  // ==================== 內容設定 ====================

  async getContentSettings(): Promise<ContentSettings> {
    const response = await apiClient.get('/api/settings/content');
    return response.data;
  },

  async updateContentSettings(settings: ContentSettings): Promise<void> {
    await apiClient.put('/api/settings/content', settings);
  },

  // ==================== 會員申請須知設定 ====================

  async getMembershipGuideSettings(): Promise<MembershipGuideSettings> {
    const response = await apiClient.get('/api/settings/membership-guide');
    return response.data;
  },

  async updateMembershipGuideSettings(settings: MembershipGuideSettings): Promise<void> {
    await apiClient.put('/api/settings/membership-guide', settings);
  },

  // ==================== ProTrack 整合設定 ====================

  async getProTrackSettings(): Promise<ProTrackSettings> {
    const response = await apiClient.get('/api/settings/protrack');
    return response.data;
  },

  async updateProTrackSettings(settings: ProTrackSettings): Promise<void> {
    await apiClient.put('/api/settings/protrack', settings);
  },

  async testProTrackConnection(settings: ProTrackSettings): Promise<{ success: boolean; message: string; count?: number }> {
    const response = await apiClient.post('/api/settings/protrack/test', settings);
    return response.data;
  },

  // ==================== AI 語意搜尋設定 ====================

  async getEmbeddingSettings(): Promise<EmbeddingSettings> {
    const response = await apiClient.get('/api/settings/embedding');
    return response.data;
  },

  async updateEmbeddingSettings(settings: EmbeddingSettings): Promise<void> {
    await apiClient.put('/api/settings/embedding', settings);
  },

  async testEmbeddingConnection(settings: EmbeddingSettings): Promise<EmbeddingTestResult> {
    const response = await apiClient.post('/api/settings/embedding/test', settings);
    return response.data;
  },
};
