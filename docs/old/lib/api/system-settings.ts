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
  EmailTemplatePreviewResponse
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
};
