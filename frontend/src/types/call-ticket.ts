import { RankProgress } from "./profile";

export interface CallTicketItem {
  id: number;
  seller_id: number;
  seller_name: string;
  ticket_duration_minutes: number;
  price_jpy: number;
  is_available: boolean;
  scheduled_date: string;
  start_time: string;
  end_time: string;
}

export interface PurchasedTicketItem {
  purchase_id: number;
  ticket_id: number;
  seller_id: number;
  seller_name: string;
  ticket_duration_minutes: number;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  amount_jpy: number;
  purchased_at: string;
  used_at?: string;
  is_used: boolean;
}

export interface CreatedTicketItem {
  ticket_id: number;
  ticket_number: number;
  ticket_duration_minutes: number;
  price_jpy: number;
  is_available: boolean;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  created_at: string;
  sold_at?: string;
  buyer_id?: number;
  buyer_name?: string;
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
