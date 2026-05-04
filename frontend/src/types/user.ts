export interface UserCard {
  id: number;
  displayName: string;
  age?: number;
  location?: string;
  bio?: string;
  rank?: number;
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
  iconFrameImageUrl?: string;
  iconFrameRarity?: string;
  iconFrameName?: string;
}

export interface FootprintItem {
  visitorId: number;
  visitorName: string;
  viewedAt: string;
}
