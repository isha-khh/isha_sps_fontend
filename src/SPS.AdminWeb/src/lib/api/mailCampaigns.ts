import { apiClient } from '@/lib/api-client';
import type {
  CampaignDetail,
  CampaignListItem,
  CampaignListQueryParams,
  EnqueueCampaignResponse,
  PreviewBodyRequest,
  PreviewBodyResponse,
  PreviewRecipientListRequest,
  PreviewRecipientListResponse,
  PreviewRecipientRequest,
  PreviewRecipientResponse,
  SendCampaignRequest,
  TestSendCampaignRequest,
} from '@/types/mailCampaign';
import { EmailSendMode } from '@/types/mailCampaign';
import type { PagedResponse } from '@/types/api';

export const mailCampaignsApi = {
  async previewRecipientCount(
    request: PreviewRecipientRequest
  ): Promise<PreviewRecipientResponse> {
    const response = await apiClient.post('/api/MailCampaign/preview', {
      companyIds: request.companyIds ?? [],
      memberIds: request.memberIds ?? [],
      filter: request.filter,
      broadcast: request.broadcast ?? false,
    });
    return response.data;
  },

  async previewRecipientList(
    request: PreviewRecipientListRequest
  ): Promise<PreviewRecipientListResponse> {
    const response = await apiClient.post('/api/MailCampaign/preview-list', {
      companyIds: request.companyIds ?? [],
      memberIds: request.memberIds ?? [],
      filter: request.filter,
      broadcast: request.broadcast ?? false,
      limit: request.limit ?? 50,
    });
    return response.data;
  },

  async send(request: SendCampaignRequest): Promise<EnqueueCampaignResponse> {
    const response = await apiClient.post('/api/MailCampaign/send', {
      subject: request.subject,
      body: request.body,
      companyIds: request.companyIds ?? [],
      memberIds: request.memberIds ?? [],
      sendMode: request.sendMode ?? EmailSendMode.Bcc,
      filter: request.filter,
      scheduleAt: request.scheduleAt ?? null,
      broadcast: request.broadcast ?? false,
      applyLayout: request.applyLayout ?? true,
      attachmentFileIds: request.attachmentFileIds ?? [],
    });
    return response.data;
  },

  async previewBody(request: PreviewBodyRequest): Promise<PreviewBodyResponse> {
    const response = await apiClient.post('/api/MailCampaign/preview-body', request);
    return response.data;
  },

  async testSend(request: TestSendCampaignRequest): Promise<void> {
    await apiClient.post('/api/MailCampaign/test-send', request);
  },

  async list(
    params: CampaignListQueryParams = {}
  ): Promise<PagedResponse<CampaignListItem>> {
    const response = await apiClient.get('/api/MailCampaign', {
      params: {
        Page: params.page ?? 1,
        PageSize: params.pageSize ?? 20,
        Status: params.status,
        Search: params.search,
      },
    });
    return response.data;
  },

  async getById(id: string): Promise<CampaignDetail> {
    const response = await apiClient.get(`/api/MailCampaign/${id}`);
    return response.data;
  },

  async cancel(id: string): Promise<void> {
    await apiClient.post(`/api/MailCampaign/${id}/cancel`);
  },

  async retryFailed(id: string): Promise<EnqueueCampaignResponse> {
    const response = await apiClient.post(`/api/MailCampaign/${id}/retry-failed`);
    return response.data;
  },
};
