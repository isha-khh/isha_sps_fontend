import { apiClient } from "@/lib/api-client";
import type { ChatRecordDto, MessageDto } from "@/types/member-chat";
import { INBOX_CHANGED_EVENT } from "@/lib/api/member-notifications";

/**
 * 會員與客服的對話（`api/member-chat`）。前台用 HTTP 傳訊息、輪詢更新，不依賴即時連線（SignalR）；
 * 後台客服那端仍是即時推送。會員之間的對話目前後端不開放。
 */
export const memberChatApi = {
  async getChats(): Promise<ChatRecordDto[]> {
    return (await apiClient.get<ChatRecordDto[]>("/api/member-chat/list")).data;
  },
  async getMessages(chatRecordId: number): Promise<MessageDto[]> {
    return (await apiClient.get<MessageDto[]>(`/api/member-chat/${chatRecordId}/messages`, { params: { take: 200 } })).data;
  },
  /** 聯絡客服：已經有進行中的對話就回傳那一個，沒有才建立新的（並通知客服） */
  async createCustomerServiceChat(): Promise<ChatRecordDto> {
    return (await apiClient.post<ChatRecordDto>("/api/member-chat/create-admin")).data;
  },
  async sendMessage(chatRecordId: number, text: string): Promise<MessageDto> {
    return (await apiClient.post<MessageDto>(`/api/member-chat/${chatRecordId}/messages`, { text })).data;
  },
  /** 回報「我正在輸入」，客服那端會顯示「會員正在輸入」；輸入中每幾秒呼叫一次即可 */
  async sendTyping(chatRecordId: number): Promise<void> {
    await apiClient.post(`/api/member-chat/${chatRecordId}/typing`);
  },
  /** 客服是不是正在輸入（輸入狀態 5 秒內沒更新就當作停止） */
  async getAgentTyping(chatRecordId: number): Promise<boolean> {
    return (await apiClient.get<{ agentTyping: boolean }>(`/api/member-chat/${chatRecordId}/typing`)).data.agentTyping;
  },
  async markRead(chatRecordId: number): Promise<void> {
    await apiClient.post(`/api/member-chat/${chatRecordId}/read`);
    // 頁首的未讀數也包含客服訊息，標已讀後要重新查
    if (typeof window !== "undefined") window.dispatchEvent(new Event(INBOX_CHANGED_EVENT));
  },
};
