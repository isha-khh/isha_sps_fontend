// Notification related types based on backend DTOs

export interface NotificationResponse {
  id: number;
  type: number;
  category?: string;
  title?: string;
  content?: string;
  sendId?: string;
  recipient?: string;
  read: boolean;
  expiration?: string;
  createdTime: string;
  updatedTime: string;
}

export interface CreateNotificationRequest {
  type: number;
  category?: string;
  title: string;
  content: string;
  sendId?: string;
  recipient: string;
  expiration?: string;
}

export interface UnreadCountResponse {
  count: number;
}
