import React, { useEffect, useState } from "react";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { ActionButton } from "../../components/common/ActionButton";
import { ActionButtonRow } from "../../components/common/ActionButtonRow";
import { EmptyState } from "../../components/common/EmptyState";
import { LoadingState } from "../../components/common/LoadingState";
import { SectionCard } from "../../components/common/SectionCard";
import apiClient, { isUnauthorizedError } from "../../services/api";
import { LikeActionResponse } from "../../types/match";
import { MeetDecisionResponse, MeetIncomingRequestItem } from "../../types/meet";
import {
  mapNotificationItem,
  NotificationItem,
  NotificationItemResponse,
  NotificationMarkReadResponse,
  NotificationUnreadCountResponse,
} from "../../types/notification";
import { RankProgress } from "../../types/profile";
import { formatRankProgressLabel } from "../../utils/rankProgress";

type LikeBlockedByFilterDetail = {
  message?: string;
  senderRank?: number;
  requiredRank?: number;
  rankProgress?: RankProgress;
};

const getNotificationTypeLabel = (type: string): string => {
  switch (type) {
    case "like":
      return "いいね";
    case "match":
      return "マッチ";
    case "meet_request":
      return "デート申込";
    case "meet_completed":
      return "デート完了";
    case "meet_accepted":
      return "デート承諾";
    case "meet_rejected":
      return "デート却下";
    case "meet_trouble":
      return "デートトラブル";
    case "rank_penalty":
      return "ランク変動";
    case "review":
      return "レビュー";
    case "match_expired":
      return "期限切れ";
    case "gift":
      return "ギフト";
    case "tip":
      return "投げ銭";
    case "fanclub_join":
      return "ファンクラブ";
    default:
      return "通知";
  }
};

const BADGE_COLOR: Record<string, string> = {
  like: "#3b82f6",
  match: "#22c55e",
  meet_request: "#eab308",
  meet_completed: "#14b8a6",
  meet_accepted: "#14b8a6",
  meet_rejected: "#ef4444",
  meet_trouble: "#ef4444",
  rank_penalty: "#f97316",
  review: "#a855f7",
  match_expired: "#9ca3af",
  gift: "#ec4899",
  tip: "#facc15",
  fanclub_join: "#6366f1",
};

const getBadgeColor = (type: string) => BADGE_COLOR[type] ?? "#6b7280";

export function NotificationScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [incomingMeetRequests, setIncomingMeetRequests] = useState<MeetIncomingRequestItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stopPolling, setStopPolling] = useState(false);

  useEffect(() => {
    if (stopPolling) {
      return;
    }
    const interval = setInterval(fetchNotifications, 5000);
    fetchNotifications();
    return () => clearInterval(interval);
  }, [stopPolling]);

  const fetchNotifications = async () => {
    try {
      const [responseResult, meetResult, unreadResult] = await Promise.allSettled([
        apiClient.get<NotificationItemResponse[]>("/notifications"),
        apiClient.get<MeetIncomingRequestItem[]>("/meet/incoming"),
        apiClient.get<NotificationUnreadCountResponse>("/notifications/unread-count"),
      ]);

      const unauthorizedDetected = [responseResult, meetResult, unreadResult].some(
        (result) =>
          result.status === "rejected" &&
          ((result.reason as Error)?.message === "AUTH_TOKEN_MISSING" ||
            isUnauthorizedError(result.reason)),
      );
      if (unauthorizedDetected) {
        setStopPolling(true);
        setNotifications([]);
        setIncomingMeetRequests([]);
        setUnreadCount(0);
        return;
      }

      const notificationRows =
        responseResult.status === "fulfilled" ? responseResult.value.data || [] : [];
      const mapped: NotificationItem[] = notificationRows.map(mapNotificationItem);
      const sorted = [...mapped].sort((a, b) => {
        if (a.isRead === b.isRead) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return a.isRead ? 1 : -1;
      });
      setNotifications(sorted);

      if (meetResult.status === "fulfilled") {
        setIncomingMeetRequests(meetResult.value.data || []);
      } else {
        setIncomingMeetRequests([]);
      }

      if (unreadResult.status === "fulfilled") {
        setUnreadCount(Number(unreadResult.value.data?.unreadCount || 0));
      } else {
        setUnreadCount(sorted.filter((item) => !item.isRead).length);
      }
    } catch (error) {
      if ((error as Error)?.message === "AUTH_TOKEN_MISSING" || isUnauthorizedError(error)) {
        setStopPolling(true);
        setNotifications([]);
        setIncomingMeetRequests([]);
        setUnreadCount(0);
        return;
      }
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item)),
    );

    try {
      await apiClient.patch<NotificationMarkReadResponse>(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      fetchNotifications();
    }
  };

  const handleNotificationPress = async (item: NotificationItem) => {
    await markAsRead(item.id);

    if ((item.type === "like" || item.type === "match") && item.targetUserId) {
      router.push(`/user/${item.targetUserId}`);
      return;
    }

    if (
      item.type === "meet_request" ||
      item.type === "meet_completed" ||
      item.type === "meet_accepted" ||
      item.type === "meet_rejected" ||
      item.type === "match_expired"
    ) {
      router.push("/(tabs)/matches");
      return;
    }

    if (item.type === "review" || item.type === "rank_penalty" || item.type === "meet_trouble") {
      router.push("/(tabs)/profile");
      return;
    }

    if (item.type === "gift") {
      router.push({ pathname: "/gifts", params: { tab: "received" } });
      return;
    }

    if (item.type === "tip") {
      router.push("/live");
      return;
    }

    if (item.type === "fanclub_join") {
      router.push("/fanclub");
    }
  };

  const buildPrimaryText = (item: NotificationItem): string => {
    const name = item.targetDisplayName || "相手ユーザー";
    if (item.type === "like") return `${name} さんからいいね`;
    if (item.type === "match") return `${name} さんとマッチ`;
    if (item.type === "match_expired") return `${name} さん宛のいいねが期限切れ`;
    if (item.type === "meet_accepted") return `${name} さんがデート予約を承諾`;
    if (item.type === "meet_rejected") return `${name} さんがデート予約を却下`;
    if (item.type === "meet_completed") return `${name} さんとのデート完了通知`;
    if (item.type === "meet_trouble") return `${name} さんとのデートトラブル通知`;
    if (item.type === "rank_penalty") return `${name} さん関連のランク変動通知`;
    if (item.type === "review") return `${name} さんからのレビュー通知`;
    if (item.type === "gift") return `${name} さんとのギフト通知`;
    if (item.type === "tip") return `${name} さんとの投げ銭通知`;
    if (item.type === "fanclub_join") return `${name} さんのファンクラブ通知`;
    return item.content;
  };

  const buildSecondaryText = (item: NotificationItem): string => {
    const primary = buildPrimaryText(item);
    if (!item.content || item.content === primary) {
      return "";
    }
    return item.content;
  };

  const markAllAsRead = async () => {
    const hasUnread = notifications.some((item) => !item.isRead);
    if (!hasUnread) {
      return;
    }

    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    try {
      await apiClient.patch<NotificationMarkReadResponse>("/notifications/read-all");
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      fetchNotifications();
    }
  };

  const handleMeetDecision = async (requestId: number, action: "accept" | "reject") => {
    try {
      const response = await apiClient.post<MeetDecisionResponse>(`/meet/${action}/${requestId}`);
      setIncomingMeetRequests((prev) =>
        prev.map((item) =>
          item.request_id === requestId
            ? { ...item, status: action === "accept" ? "accepted" : "rejected" }
            : item,
        ),
      );
      fetchNotifications();
      Alert.alert(
        "完了",
        response.data?.message ||
          (action === "accept" ? "デート申込を承諾しました" : "デート申込を却下しました"),
      );
    } catch (error) {
      console.error(`Failed to ${action} meet request:`, error);
      Alert.alert("エラー", "更新に失敗しました");
    }
  };

  const handleRelike = async (item: NotificationItem) => {
    if (!item.targetUserId) {
      router.push("/(tabs)");
      return;
    }

    try {
      await markAsRead(item.id);
      const response = await apiClient.post<LikeActionResponse>("/matches/like", {
        target_user_id: item.targetUserId,
      });

      if (response.data?.status === "matched") {
        Alert.alert("マッチ成立", response.data?.message || "お互いにいいねしました！");
      } else if (response.data?.status === "already_pending") {
        Alert.alert("依頼中", response.data?.message || "このユーザーには既に依頼中です");
      } else if (response.data?.status === "already_matched") {
        Alert.alert("マッチ済み", response.data?.message || "このユーザーとは既にマッチしています");
      } else if (response.data?.status === "blocked_by_filter") {
        const detail = response.data as LikeBlockedByFilterDetail;
        const progressText = formatRankProgressLabel(detail.rankProgress);
        const message = detail.message || "相手の受信フィルターにより、いいねを送れませんでした";
        Alert.alert(
          "送信不可",
          progressText
            ? `${message}\n\n次ランク条件: ${progressText}`
            : `${message}${
                detail.requiredRank && detail.senderRank
                  ? `\n現在ランク: Rank${detail.senderRank} / 必要ランク: Rank${detail.requiredRank}`
                  : ""
              }`,
          [
            { text: "閉じる", style: "cancel" },
            {
              text: "次ランク条件を見る",
              onPress: () => router.push("/(tabs)/profile?focus=rank"),
            },
          ],
        );
      } else {
        Alert.alert("完了", response.data?.message || "いいねを再送しました");
      }

      fetchNotifications();
    } catch (error) {
      console.error("Failed to re-like from notification:", error);
      Alert.alert("エラー", "再依頼に失敗しました");
    }
  };

  const openTargetProfile = async (item: NotificationItem) => {
    if (!item.targetUserId) {
      return;
    }
    await markAsRead(item.id);
    router.push(`/user/${item.targetUserId}`);
  };

  if (loading) {
    return (
      <LoadingState
        color="#e74c3c"
        containerStyle={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12 }}>
        <SectionCard
          style={{
            flex: 1,
            borderRadius: 12,
            padding: 12,
            backgroundColor: "#f9fafb",
            borderWidth: 1,
            borderColor: "#e5e7eb",
          }}
        >
          <Text style={{ marginBottom: 2, fontSize: 12, color: "#6b7280" }}>未読通知</Text>
          <Text style={{ fontSize: 24, fontWeight: "700", color: "#ef4444" }}>{unreadCount}件</Text>
        </SectionCard>
      </View>
      <TouchableOpacity
        style={{
          marginHorizontal: 16,
          marginBottom: 8,
          alignItems: "center",
          borderRadius: 8,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          paddingVertical: 10,
        }}
        onPress={markAllAsRead}
      >
        <Text style={{ fontSize: 14, fontWeight: "600", color: "#6b7280" }}>すべて既読にする</Text>
      </TouchableOpacity>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          incomingMeetRequests.length > 0 ? (
            <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
              <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: "700", color: "#374151" }}>
                デート申込
              </Text>
              {incomingMeetRequests.map((item) => (
                <SectionCard
                  key={item.request_id}
                  style={{
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 8,
                    backgroundColor: "#fffbeb",
                    borderWidth: 1,
                    borderColor: "#fde68a",
                  }}
                >
                  <Text style={{ marginBottom: 8, fontSize: 14, color: "#1f2937" }}>
                    {item.from_display_name} さんから {item.scheduled_date} {item.scheduled_time}
                  </Text>
                  <TouchableOpacity
                    style={{ marginBottom: 8 }}
                    onPress={() => router.push(`/chat/${item.from_user_id}`)}
                  >
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#2563eb" }}>
                      チャットを開く
                    </Text>
                  </TouchableOpacity>
                  {item.status === "pending" ? (
                    <ActionButtonRow style={{ gap: 8 }}>
                      <ActionButton
                        label="承諾"
                        style={{
                          flex: 1,
                          backgroundColor: "#22c55e",
                          borderRadius: 8,
                          paddingVertical: 10,
                          alignItems: "center",
                        }}
                        textStyle={{ color: "#fff", fontSize: 14, fontWeight: "700" }}
                        onPress={() => handleMeetDecision(item.request_id, "accept")}
                      />
                      <ActionButton
                        label="却下"
                        variant="danger"
                        style={{
                          flex: 1,
                          backgroundColor: "#ef4444",
                          borderRadius: 8,
                          paddingVertical: 10,
                          alignItems: "center",
                        }}
                        textStyle={{ color: "#fff", fontSize: 14, fontWeight: "700" }}
                        onPress={() => handleMeetDecision(item.request_id, "reject")}
                      />
                    </ActionButtonRow>
                  ) : (
                    <Text style={{ fontSize: 12, color: "#6b7280" }}>
                      {item.status === "accepted" ? "承諾済み" : "却下済み"}
                    </Text>
                  )}
                </SectionCard>
              ))}
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              marginHorizontal: 16,
              marginBottom: 8,
              borderRadius: 12,
              borderWidth: 1,
              padding: 14,
              borderColor: item.isRead ? "#f3f4f6" : "#fecaca",
              backgroundColor: item.isRead ? "#f9fafb" : "#fef2f2",
            }}
            onPress={() => handleNotificationPress(item)}
            activeOpacity={0.8}
          >
            <View style={{ marginBottom: 6, flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  borderRadius: 9999,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  backgroundColor: getBadgeColor(item.type),
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#ffffff" }}>
                  {getNotificationTypeLabel(item.type)}
                </Text>
              </View>
            </View>
            <Text style={{ marginBottom: 2, fontSize: 14, fontWeight: "600", color: "#1f2937" }}>
              {buildPrimaryText(item)}
            </Text>
            {buildSecondaryText(item) ? (
              <Text style={{ marginBottom: 4, fontSize: 12, color: "#6b7280" }}>
                {buildSecondaryText(item)}
              </Text>
            ) : null}
            {(item.type === "like" || item.type === "match" || item.type === "match_expired") &&
            item.targetUserId ? (
              <ActionButtonRow style={{ gap: 8, marginTop: 8 }}>
                <ActionButton
                  label="プロフィールを見る"
                  variant="secondary"
                  style={{
                    borderRadius: 8,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    backgroundColor: "#f3f4f6",
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                  }}
                  textStyle={{ fontSize: 12, color: "#374151", fontWeight: "700" }}
                  onPress={() => openTargetProfile(item)}
                />
                {item.type === "match_expired" && (
                  <ActionButton
                    label="もう一度いいねを送る"
                    style={{
                      borderRadius: 8,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      backgroundColor: "#e74c3c",
                    }}
                    textStyle={{ fontSize: 12, color: "#fff", fontWeight: "700" }}
                    onPress={() => handleRelike(item)}
                  />
                )}
              </ActionButtonRow>
            ) : null}
            <Text style={{ marginTop: 4, fontSize: 12, color: "#9ca3af" }}>
              {new Date(item.createdAt).toLocaleString("ja-JP")}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            message="通知はありません"
            containerStyle={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingTop: 80,
            }}
            textStyle={{ fontSize: 14, color: "#9ca3af", textAlign: "center" }}
          />
        }
      />
    </View>
  );
}
