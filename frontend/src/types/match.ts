export interface MatchListItem {
  id: number;
  displayName?: string;
  age?: number;
  location?: string;
  bio?: string;
  rank?: number;
  matchedAt?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

export interface OutgoingLikeItem {
  requestId: number;
  targetUserId: number;
  displayName?: string;
  age?: number;
  rank?: number;
  status: "pending" | "expired" | string;
  createdAt: string;
}

export interface IncomingLikeItem {
  requestId: number;
  sourceUserId: number;
  displayName?: string;
  age?: number;
  location?: string;
  bio?: string;
  rank?: number;
  lastLoginAt?: string;
  createdAt: string;
}

export interface LikeActionResponse {
  status:
    | "success"
    | "matched"
    | "already_pending"
    | "already_matched"
    | "blocked_by_filter"
    | string;
  action?: "like" | string;
  match_id?: number;
  reason?: string;
  message: string;
  senderRank?: number;
  blockedByRank?: number;
  requiredRank?: number;
  rankProgress?: import("./profile").RankProgress;
}

export interface PassActionResponse {
  status: "success" | "already_exists" | string;
  action: "pass" | string;
  match_id: number;
  message: string;
}

export interface IncomingLikeAcceptResponse {
  status: "matched" | "already_processed" | string;
  requestId: number;
  targetUserId: number;
  message: string;
}

export interface IncomingLikeRejectResponse {
  status: "passed" | "already_processed" | string;
  requestId: number;
  targetUserId: number;
  message: string;
}
