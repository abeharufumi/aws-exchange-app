export interface BoostPurchaseResponse {
  boost_id: number;
  user_id: number;
  expires_at?: string | null;
  message_bonus_total: number;
  message_bonus_used: number;
  message_bonus_remaining: number;
}

export interface BoostActivationResponse {
  status: "activated" | "already_activated" | string;
  boost_id: number;
  expires_at: string;
}

export interface ActiveBoostResponse {
  boost_id: number;
  activated_at: string;
  expires_at: string;
  message_bonus_remaining?: number;
}
