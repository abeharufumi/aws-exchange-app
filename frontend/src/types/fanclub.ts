import { RankProgress } from "./profile";

export interface FanclubCreatorInfo {
  creator_id: number;
  creator_name: string;
  member_count: number;
  monthly_price_jpy: number;
  is_subscribed: boolean;
}

export interface FanclubSubscriptionItem {
  creator_id: number;
  creator_name: string;
  joined_at: string;
  expires_at?: string;
  status: "active" | "cancelled" | "expired" | string;
  monthly_price_jpy: number;
}

export interface FanclubMemberItem {
  member_id: number;
  member_name: string;
  joined_at: string;
  expires_at?: string;
  status: "active" | "cancelled" | "expired" | string;
  monthly_price_jpy: number;
}

export interface MembersRestrictionDetail {
  message: string;
  requiredRank?: number;
  currentRank?: number;
  rankProgress?: RankProgress;
}

export interface CreatorRestrictionDetail {
  message?: string;
  requiredRank?: number;
  currentRank?: number;
  creatorId?: number;
  rankProgress?: RankProgress;
}

export interface FanclubSubscribeResponse {
  status: "subscribed" | string;
  creator_id: number;
  monthly_price_jpy: number;
}

export interface FanclubCancelResponse {
  status: "cancelled" | string;
  creator_id: number;
}
