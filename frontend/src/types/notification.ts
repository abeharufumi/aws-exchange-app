export type NotificationType =
  | "like"
  | "match"
  | "match_expired"
  | "meet_request"
  | "meet_accepted"
  | "meet_rejected"
  | "meet_completed"
  | "meet_trouble"
  | "rank_penalty"
  | "review"
  | "gift"
  | "tip"
  | "fanclub_join"
  | string;

export interface NotificationItemResponse {
  id: number;
  type: NotificationType;
  content: string;
  target_user_id?: number | null;
  target_display_name?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  type: NotificationType;
  content: string;
  targetUserId?: number;
  targetDisplayName?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationUnreadCountResponse {
  unreadCount: number;
}

export interface NotificationMarkReadResponse {
  status: "ok" | string;
  updatedCount: number;
}

export function mapNotificationItem(response: NotificationItemResponse): NotificationItem {
  return {
    id: response.id,
    type: response.type,
    content: response.content,
    targetUserId: response.target_user_id ? Number(response.target_user_id) : undefined,
    targetDisplayName: response.target_display_name || undefined,
    isRead: response.is_read,
    createdAt: response.created_at,
  };
}
