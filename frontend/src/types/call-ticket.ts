import { RankProgress } from "./profile";

export interface CallTicketItem {
  id: number;
  seller_id: number;
  seller_name: string;
  ticket_duration_minutes: number;
  price_jpy: number;
  is_available: boolean;
}

export interface PurchasedTicketItem {
  purchase_id: number;
  ticket_id: number;
  seller_id: number;
  seller_name: string;
  ticket_duration_minutes: number;
  amount_jpy: number;
  purchased_at: string;
  used_at?: string;
  is_used: boolean;
}

export interface CallTicketCreateErrorDetail {
  message?: string;
  requiredGender?: string;
  currentRank?: number;
  requiredRank?: number;
  rankProgress?: RankProgress;
}

export interface CallTicketPurchaseResponse {
  purchase_id: number;
  ticket_id: number;
  amount_jpy: number;
  status: "purchased" | string;
}

export interface CallTicketUseResponse {
  purchase_id: number;
  status: "used" | string;
}
