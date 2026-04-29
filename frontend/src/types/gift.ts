import { RankProgress } from "./profile";

export interface GiftItem {
  id: number;
  name: string;
  price_jpy: number;
}

export interface ReceivedGiftItem {
  id: number;
  sender_id: number;
  sender_name: string;
  gift_item_id: number;
  gift_name: string;
  price_jpy: number;
  sent_at: string;
  is_opened: boolean;
}

export interface SentGiftItem {
  id: number;
  recipient_id: number;
  recipient_name: string;
  gift_item_id: number;
  gift_name: string;
  price_jpy: number;
  sent_at: string;
  is_opened: boolean;
}

export interface GiftSendResponse {
  gift_id: number;
  gift_name: string;
  price_jpy: number;
  status: "sent" | string;
}

export interface GiftOpenResponse {
  gift_id: number;
  status: "opened" | "already_opened" | string;
}

export interface GiftSendRestrictionDetail {
  message: string;
  requiredRank?: number;
  currentRank?: number;
  recipientId?: number;
  requiredGender?: string;
  recipientGender?: string;
  rankProgress?: RankProgress;
}
