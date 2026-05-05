export interface UserCard {
  id: number;
  displayName: string;
  age?: number;
  location?: string;
  bio?: string;
  rank?: number;
  isPremiumActive?: boolean;
  isBoostActive?: boolean;
  onlineStatus?: "online" | "offline" | "logged_out" | string;
  lastActiveAt?: string;
  lastLogoutAt?: string;
  reviewAvg?: number;
  requestStatus?: "pending" | "matched" | "passed" | "expired" | string;
  requestCreatedAt?: string;
}

export interface PublicUserProfile {
  id: number;
  displayName: string;
  age?: number;
  location?: string;
  bio?: string;
  avatarUrl?: string;
  rank?: number;
  meetsCount?: number;
  reviewAvg?: number;
  onlineStatus?: "online" | "offline" | "logged_out" | string;
  lastActiveAt?: string;
  lastLogoutAt?: string;
  iconFrameImageUrl?: string;
  iconFrameRarity?: string;
  iconFrameName?: string;
}

export interface FootprintItem {
  visitorId: number;
  visitorName: string;
  viewedAt: string;
}
