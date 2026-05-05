export type UserPresenceStatus = "online" | "offline" | "logged_out";

const PRESENCE_COLORS: Record<UserPresenceStatus, string> = {
  online: "#16a34a",
  offline: "#eab308",
  logged_out: "#dc2626",
};

export function getUserPresenceColor(status?: string): string {
  if (status === "online" || status === "offline" || status === "logged_out") {
    return PRESENCE_COLORS[status];
  }

  return "#9ca3af";
}

export function getMinutesSinceOnline(lastActiveAt?: string): number | null {
  if (!lastActiveAt) {
    return null;
  }

  const timestamp = new Date(lastActiveAt).getTime();
  if (Number.isNaN(timestamp)) {
    return null;
  }

  const diffMinutes = Math.floor((Date.now() - timestamp) / 60000);
  return Math.max(1, diffMinutes);
}

export function getUserPresenceText(status?: string, lastActiveAt?: string): string {
  if (status === "online") {
    return "オンライン中";
  }

  if (status === "offline") {
    const minutes = getMinutesSinceOnline(lastActiveAt);
    return minutes !== null ? `${minutes}分前にオンライン` : "少し前にオンライン";
  }

  if (status === "logged_out") {
    return "ログアウト中";
  }

  return "状態未確認";
}