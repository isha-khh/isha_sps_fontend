import { apiClient } from "@/lib/api-client";

/** 收件匣的通知種類（對應後端 `MemberNotificationType`） */
export type MemberNotificationType = "ReplyReviewed" | "ReplyReceived" | "DemandMatched" | "InquiryReplied";

export interface MemberNotification {
  id: number;
  type: MemberNotificationType;
  title: string;
  content?: string | null;
  /** 前台站內路徑（以 / 開頭），沒有就不顯示「前往查看」 */
  linkPath?: string | null;
  isRead: boolean;
  createdTime: string;
}

export interface MemberNotificationList {
  items: MemberNotification[];
  totalCount: number;
  unreadCount: number;
}

/** 收件匣內容有變動（標已讀）時發出，頁首的未讀數會重新查 */
export const INBOX_CHANGED_EVENT = "sps-inbox-changed";

export const memberNotificationsApi = {
  async getList(options: { unreadOnly?: boolean; page?: number; pageSize?: number } = {}): Promise<MemberNotificationList> {
    const { unreadOnly = false, page = 1, pageSize = 20 } = options;
    return (await apiClient.get<MemberNotificationList>("/api/member/notifications", { params: { unreadOnly, page, pageSize } })).data;
  },
  /** 系統通知與客服訊息的未讀數；沒登入也可以呼叫（回 0），不會被導去登入頁 */
  async getUnreadCount(): Promise<{ unreadCount: number; chatUnreadCount: number }> {
    return (await apiClient.get<{ unreadCount: number; chatUnreadCount: number }>("/api/member/notifications/unread-count")).data;
  },
  async markRead(id: number): Promise<void> {
    await apiClient.post(`/api/member/notifications/${id}/read`);
    if (typeof window !== "undefined") window.dispatchEvent(new Event(INBOX_CHANGED_EVENT));
  },
  async markAllRead(): Promise<void> {
    await apiClient.post("/api/member/notifications/read-all");
    if (typeof window !== "undefined") window.dispatchEvent(new Event(INBOX_CHANGED_EVENT));
  },
};
