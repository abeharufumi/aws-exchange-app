export interface ReceiveFilter {
  blockRank1: boolean;
  blockRank2: boolean;
  blockRank3: boolean;
  tributeFilterEnabled: boolean;
}

export interface RankProgressItem {
  key: string;
  label: string;
  currentValue: number;
  requiredValue: number;
  unit?: string;
  done: boolean;
}

export interface RankProgress {
  currentRank: number;
  nextRank?: number | null;
  isMaxRank: boolean;
  items: RankProgressItem[];
}

export interface UserProfile {
  id: number;
  email: string;
  gender: string;
  phoneNumber?: string;
  displayName: string;
  age?: number;
  location?: string;
  bio?: string;
  avatarUrl?: string;
  rank?: number;
  meetsCount?: number;
  reviewAvg?: number;
  replyRate?: number;
  mannerPoints?: number;
  canViewFootprints?: boolean;
  footprintViewLimit?: number;
  canUseAgeFilter?: boolean;
  canUseRankFilter?: boolean;
  receiveFilter?: ReceiveFilter;
  rankProgress?: RankProgress;
  iconFrameImageUrl?: string;
}

export interface ProfileUpdateResponse {
  status: "updated" | string;
}
