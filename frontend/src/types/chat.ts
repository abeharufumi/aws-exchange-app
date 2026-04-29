export interface ChatMessage {
  id: number;
  senderId: number;
  message: string;
  sentAt: string;
  isRead: boolean;
  isSender: boolean;
}

export interface ChatMessageResponse {
  id: number;
  sender_id: number;
  message: string;
  sent_at: string;
  is_read: boolean;
}

export interface ChatQuotaResponse {
  currentRank: number;
  usedToday: number;
  dailyLimit?: number | null;
  remainingToday?: number | null;
  isUnlimited: boolean;
  hasPremium: boolean;
  hasBoost: boolean;
  rankProgress?: import("./profile").RankProgress;
}

export interface ChatReadResponse {
  status: "no_target" | "updated" | string;
  updated: number;
}

export interface ChatSendMessageResponse {
  message_id: number;
  status: "sent" | string;
}
