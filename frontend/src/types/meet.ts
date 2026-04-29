export type MeetStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "completed"
  | "cancelled"
  | "reported"
  | string;

export interface MeetRequestResponse {
  request_id: number;
  status: MeetStatus;
  message: string;
}

export interface MeetDecisionResponse {
  request_id: number;
  status: "accepted" | "rejected" | string;
  message: string;
}

export interface MeetBetweenUsersResponse {
  exists: boolean;
  request_id?: number;
  status?: MeetStatus;
  role?: "sender" | "receiver" | string;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  meet_latitude?: number | null;
  meet_longitude?: number | null;
}

export interface MeetIncomingRequestItem {
  request_id: number;
  from_user_id: number;
  from_display_name: string;
  scheduled_date: string;
  scheduled_time: string;
  status: MeetStatus;
}

export interface MeetReviewStatusResponse {
  meet_request_id: number;
  can_review: boolean;
  reviewed: boolean;
  target_user_id?: number | null;
}

export interface MeetReviewSubmitResponse {
  status: "submitted" | string;
  review_id: number;
  message: string;
}

export interface MeetTroubleActionResponse {
  request_id: number;
  status: "cancelled" | "reported" | string;
  message: string;
}

export interface QRMeetCenterResponse {
  latitude: number;
  longitude: number;
}

export interface QRInfoResponse {
  request_id: number;
  status: "accepted" | "completed" | string;
  role: "sender" | "receiver" | string;
  qr_token?: string | null;
  expires_in_seconds: number;
  qr_enabled: boolean;
  required_radius_meters: number;
  meet_center: QRMeetCenterResponse;
  already_verified: boolean;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
}

export interface QRVerifyResponse {
  status: "verified" | string;
  completed_meet_id: number;
  meet_request_id: number;
  message: string;
}
