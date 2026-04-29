import { RankProgress } from "./profile";

export interface LiveStreamItem {
  id: number;
  broadcaster_id: number;
  broadcaster_name: string;
  title: string;
  viewer_count: number;
  total_tipping_jpy: number;
  status: "live" | "ended" | string;
  started_at: string;
}

export interface TipResponse {
  transaction_id: number;
  stream_id: number;
  amount_jpy: number;
  status: "completed" | string;
}

export interface EndStreamResponse {
  stream_id: number;
  status: "ended" | string;
}

export interface LiveStartErrorDetail {
  message?: string;
  currentRank?: number;
  requiredRank?: number;
  rankProgress?: RankProgress;
}

export interface LiveTipRestrictionDetail {
  message?: string;
  requiredRank?: number;
  currentRank?: number;
  requiredGender?: string;
  broadcasterGender?: string;
  broadcasterId?: number;
  rankProgress?: RankProgress;
}
