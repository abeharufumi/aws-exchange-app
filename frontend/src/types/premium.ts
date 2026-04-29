export interface PremiumSubscriptionResponse {
  subscription_id: number;
  user_id: number;
  ends_at?: string | null;
  status: "active" | "cancelled" | string;
}

export interface PremiumCancelResponse {
  status: "cancelled" | string;
  message: string;
}

export interface PremiumStatusResponse {
  subscription_id: number;
  status: "active" | "cancelled" | string;
  ends_at?: string | null;
  last_charge_at?: string | null;
  next_charge_at?: string | null;
}
