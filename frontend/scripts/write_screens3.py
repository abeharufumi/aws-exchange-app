#!/usr/bin/env python3
"""Rewrite LiveScreen, CallTicketScreen, GiftScreen to use className."""
import os

BASE = "/Users/abeharufumi/Projects/aws-exchange-app/frontend/src/screens"


def write(path, content):
    full = os.path.join(BASE, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w") as f:
        f.write(content)
    #!/usr/bin/env python3
    """Rewrite LiveScreen, CallTicketScreen, GiftScreen, NotificationScreen."""
    import os

    BASE = "/Users/abeharufumi/Projects/aws-exchange-app/frontend/src/screens"

    def write(path, content):
        full = os.path.join(BASE, path)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w") as f:
            f.write(content)
        print(f"Written: {path}")

    LIVE = r"""import React, { useCallback, useState } from "react";
    import { FlatList, Text, TextInput, TouchableOpacity, View, Alert } from "react-native";
    import { useFocusEffect, useRouter } from "expo-router";
    import { ActionButton } from "../../components/common/ActionButton";
    import { EmptyState } from "../../components/common/EmptyState";
    import { LoadingState } from "../../components/common/LoadingState";
    import { ScreenBackButton } from "../../components/common/ScreenBackButton";
    import { SegmentedTab } from "../../components/common/SegmentedTab";
    import { SectionCard } from "../../components/common/SectionCard";
    import apiClient from "../../services/api";
    import { useAuth } from "../../contexts/auth";
    import { LiveStartErrorDetail, LiveStreamItem } from "../../types/live";
    import { UserProfile } from "../../types/profile";
    import { formatRankProgressLabel } from "../../utils/rankProgress";

    const LIVE_TABS = [
      { key: "live", label: "配信中" },
      { key: "history", label: "配信履歴" },
    ] as const;

    export function LiveScreen() {
      const router = useRouter();
      const { user } = useAuth();
      const [streams, setStreams] = useState<LiveStreamItem[]>([]);
      const [history, setHistory] = useState<LiveStreamItem[]>([]);
      const [myProfile, setMyProfile] = useState<Pick<UserProfile, "rank" | "rankProgress"> | null>(null);
      const [loading, setLoading] = useState(true);
      const [starting, setStarting] = useState(false);
      const [title, setTitle] = useState("");
      const [showStartForm, setShowStartForm] = useState(false);
      const [tab, setTab] = useState<"live" | "history">("live");

      const fetchData = useCallback(async () => {
        try {
          setLoading(true);
          const [streamsResponse, historyResponse, profileResponse] = await Promise.all([
            apiClient.get<LiveStreamItem[]>("/live"),
            apiClient.get<LiveStreamItem[]>("/live/my-history").catch(() => ({ data: [] })),
            apiClient.get<UserProfile>("/users/me").catch(() => ({ data: null })),
          ]);
          setStreams(streamsResponse.data || []);
          setHistory(historyResponse.data || []);
          setMyProfile(
            profileResponse?.data
              ? { rank: Number(profileResponse.data.rank || 1), rankProgress: profileResponse.data.rankProgress }
              : null,
          );
        } catch (error) {
          console.error("Failed to fetch live data:", error);
          setStreams([]);
          setHistory([]);
          setMyProfile(null);
        } finally {
          setLoading(false);
        }
      }, []);

      useFocusEffect(
        useCallback(() => {
          fetchData();
        }, [fetchData]),
      );

      const currentRank = Number(myProfile?.rank || 1);
      const rankProgress = myProfile?.rankProgress;
      const canStartLive = currentRank >= 5;

      const handleStart = async () => {
        if (!canStartLive) {
          const progressText = formatRankProgressLabel(rankProgress);
          Alert.alert(
            "ランク条件未達",
            progressText
              ? `ライブ配信はRank5以上で解放されます。\n\n次ランク条件: ${progressText}`
              : "ライブ配信はRank5以上で解放されます。",
            [
              { text: "閉じる", style: "cancel" },
              { text: "次ランク条件を見る", onPress: () => router.push("/(tabs)/profile?focus=rank") },
            ],
          );
          return;
        }

        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
          Alert.alert("入力エラー", "配信タイトルを入力してください");
          return;
        }

        try {
          setStarting(true);
          const response = await apiClient.post<LiveStreamItem>("/live/start", { title: trimmedTitle });
          setTitle("");
          setShowStartForm(false);
          router.push(`/live/${response.data.id}`);
        } catch (error: any) {
          const rawDetail = error?.response?.data?.detail;
          const detailObj: LiveStartErrorDetail | null = rawDetail && typeof rawDetail === "object" ? rawDetail : null;
          const baseMessage = (typeof rawDetail === "string" ? rawDetail : detailObj?.message) || "配信開始に失敗しました";
          const progressText = formatRankProgressLabel(detailObj?.rankProgress);

          if (error?.response?.status === 403 && detailObj?.requiredRank === 5) {
            Alert.alert(
              "ランク条件未達",
              progressText ? `${baseMessage}\n\n次ランク条件: ${progressText}` : baseMessage,
              [
                { text: "閉じる", style: "cancel" },
                { text: "次ランク条件を見る", onPress: () => router.push("/(tabs)/profile?focus=rank") },
              ],
            );
          } else {
            Alert.alert("エラー", baseMessage);
          }
        } finally {
          setStarting(false);
        }
      };

      return (
        <View className="flex-1" style={{ backgroundColor: "#0f0f0f" }}>
          <View className="px-4 pt-5 pb-3" style={{ backgroundColor: "#1a1a1a" }}>
            <ScreenBackButton
              onPress={() => router.back()}
              variant="dark"
              style={{ paddingRight: 12 }}
              textStyle={{ color: "#9ca3af", fontSize: 16 }}
            />
            <Text className="mb-1 text-2xl font-bold text-white">🔴 ライブ配信</Text>
            <Text className="text-sm text-gray-400">配信一覧の閲覧と、自分の配信管理ができます</Text>
          </View>

          <TouchableOpacity
            className="m-3 items-center rounded-xl border py-3.5"
            style={{ backgroundColor: "#1a1a1a", borderColor: "#ef4444" }}
            onPress={() => {
              if (canStartLive) {
                setShowStartForm((prev) => !prev);
                return;
              }
              router.push("/(tabs)/profile?focus=rank");
            }}
          >
            <Text className="text-base font-bold" style={{ color: "#ef4444" }}>
              {canStartLive ? (showStartForm ? "閉じる" : "＋ 配信を開始する") : "🔒 Rank5で配信解放"}
            </Text>
          </TouchableOpacity>

          {!canStartLive && (
            <SectionCard
              style={{
                marginHorizontal: 12,
                marginBottom: 10,
                backgroundColor: "#1a1a1a",
                borderRadius: 10,
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: "#374151",
              }}
            >
              <Text className="mb-1.5 text-sm font-bold text-gray-100">配信解放条件</Text>
              <Text className="mb-1 text-xs font-semibold text-gray-400">現在ランク: Rank {currentRank}</Text>
              {rankProgress && !rankProgress.isMaxRank ? (
                <>
                  <Text className="mb-1 text-xs font-semibold text-gray-400">次ランク: Rank {rankProgress.nextRank}</Text>
                  {rankProgress.items.map((item) => {
                    const unit = item.unit || "";
                    return (
                      <Text key={item.key} className="mb-1 text-xs text-gray-300">
                        {item.done ? "✓" : "・"} {item.label} {item.currentValue}
                        {unit}/{item.requiredValue}
                        {unit}
                      </Text>
                    );
                  })}
                </>
              ) : (
                <Text className="mb-1 text-xs text-gray-300">プロフィール画面で次ランク条件を確認できます</Text>
              )}
              <ActionButton
                label="次ランク条件を見る"
                variant="neutral"
                style={{ marginTop: 8, alignSelf: "flex-start", borderRadius: 8, backgroundColor: "#374151", paddingVertical: 8, paddingHorizontal: 10 }}
                textStyle={{ fontSize: 12, color: "#e5e7eb", fontWeight: "700" }}
                onPress={() => router.push("/(tabs)/profile?focus=rank")}
              />
            </SectionCard>
          )}

          {showStartForm && (
            <View className="px-4 pt-5">
              <TextInput
                style={{
                  backgroundColor: "#1e1e1e",
                  borderWidth: 1,
                  borderColor: "#374151",
                  borderRadius: 8,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  color: "#ffffff",
                  fontSize: 15,
                  marginBottom: 12,
                }}
                placeholder="配信タイトル"
                placeholderTextColor="#6b7280"
                value={title}
                onChangeText={setTitle}
              />
              <ActionButton
                label={starting ? "開始中..." : "配信開始"}
                style={[
                  { backgroundColor: "#ef4444", borderRadius: 8, paddingVertical: 12, alignItems: "center" },
                  starting ? { opacity: 0.5 } : undefined,
                ]}
                textStyle={{ color: "#ffffff", fontSize: 15, fontWeight: "700" }}
                disabled={starting}
                onPress={handleStart}
              />
            </View>
          )}

          <SegmentedTab
            items={LIVE_TABS}
            value={tab}
            onChange={setTab}
            containerStyle={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#2d2d2d" }}
            itemStyle={{ flex: 1, alignItems: "center", paddingVertical: 10 }}
            activeItemStyle={{ borderBottomWidth: 2, borderBottomColor: "#ef4444" }}
            textStyle={{ color: "#6b7280", fontWeight: "700" }}
            activeTextStyle={{ color: "#ef4444" }}
          />

          {loading ? (
            <LoadingState color="#ef4444" containerStyle={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f0f0f" }} />
          ) : tab === "live" ? (
            <FlatList
              data={streams}
              keyExtractor={(item) => item.id.toString()}
              onRefresh={fetchData}
              refreshing={loading}
              renderItem={({ item }) => (
                <SectionCard
                  style={{
                    marginHorizontal: 12,
                    marginVertical: 6,
                    backgroundColor: "#1e1e1e",
                    borderRadius: 12,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: "#2d2d2d",
                  }}
                >
                  <View className="mb-2 flex-row items-center">
                    <View className="mr-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: "#ef4444" }} />
                    <Text className="text-xs font-bold" style={{ color: "#ef4444", letterSpacing: 1 }}>
                      LIVE
                    </Text>
                  </View>
                  <Text className="mb-1 text-base font-bold text-white">{item.title}</Text>
                  <Text className="mb-2.5 text-sm text-gray-400">{item.broadcaster_name}</Text>
                  <View className="flex-row gap-4">
                    <Text className="text-xs text-gray-500">👁 {item.viewer_count}人</Text>
                    <Text className="text-xs text-gray-500">💰 ¥{item.total_tipping_jpy.toLocaleString()}</Text>
                  </View>
                  <ActionButton
                    label={user?.id === item.broadcaster_id ? "配信を管理" : "視聴する"}
                    style={{ backgroundColor: "#ef4444", borderRadius: 8, paddingVertical: 10, alignItems: "center", marginTop: 10 }}
                    textStyle={{ color: "#ffffff", fontSize: 14, fontWeight: "700" }}
                    onPress={() => router.push(`/live/${item.id}`)}
                  />
                </SectionCard>
              )}
              ListEmptyComponent={
                <EmptyState
                  message="現在配信中のライブはありません"
                  containerStyle={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 80 }}
                  textStyle={{ fontSize: 14, color: "#6b7280", textAlign: "center" }}
                />
              }
            />
          ) : (
            <FlatList
              data={history}
              keyExtractor={(item) => item.id.toString()}
              onRefresh={fetchData}
              refreshing={loading}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="mx-3 my-1.5 rounded-xl p-3"
                  style={{ backgroundColor: "#1e1e1e" }}
                  onPress={() => router.push(`/live/${item.id}`)}
                >
                  <Text className="mb-1 text-sm font-semibold text-gray-300">{item.title}</Text>
                  <Text className="text-xs text-gray-500">
                    {new Date(item.started_at).toLocaleString("ja-JP")} ・ ¥{item.total_tipping_jpy.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <EmptyState
                  message="まだ配信履歴はありません"
                  containerStyle={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 80 }}
                  textStyle={{ fontSize: 14, color: "#6b7280", textAlign: "center" }}
                />
              }
            />
          )}
        </View>
      );
    }
    """

    NOTIF = r"""import React, { useEffect, useState } from "react";
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
      like: "bg-blue-500",
      match: "bg-green-500",
      meet_request: "bg-yellow-500",
      meet_completed: "bg-teal-500",
      meet_accepted: "bg-teal-500",
      meet_rejected: "bg-red-500",
      meet_trouble: "bg-red-500",
      rank_penalty: "bg-orange-500",
      review: "bg-purple-500",
      match_expired: "bg-gray-400",
      gift: "bg-pink-500",
      tip: "bg-yellow-400",
      fanclub_join: "bg-indigo-500",
    };

    const getBadgeClass = (type: string) => BADGE_COLOR[type] ?? "bg-gray-500";

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
              ((result.reason as Error)?.message === "AUTH_TOKEN_MISSING" || isUnauthorizedError(result.reason)),
          );
          if (unauthorizedDetected) {
            setStopPolling(true);
            setNotifications([]);
            setIncomingMeetRequests([]);
            setUnreadCount(0);
            return;
          }

          const notificationRows = responseResult.status === "fulfilled" ? responseResult.value.data || [] : [];
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
          router.push("/gifts");
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
              item.request_id === requestId ? { ...item, status: action === "accept" ? "accepted" : "rejected" } : item,
            ),
          );
          fetchNotifications();
          Alert.alert(
            "完了",
            response.data?.message || (action === "accept" ? "デート申込を承諾しました" : "デート申込を却下しました"),
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
                { text: "次ランク条件を見る", onPress: () => router.push("/(tabs)/profile?focus=rank") },
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
        return <LoadingState color="#e74c3c" containerStyle={{ flex: 1, justifyContent: "center", alignItems: "center" }} />;
      }

      return (
        <View className="flex-1 bg-white">
          <View className="flex-row px-4 py-3">
            <SectionCard style={{ flex: 1, borderRadius: 12, padding: 12, backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb" }}>
              <Text className="mb-0.5 text-xs text-gray-500">未読通知</Text>
              <Text className="text-2xl font-bold text-red-500">{unreadCount}件</Text>
            </SectionCard>
          </View>
          <TouchableOpacity className="mx-4 mb-2 items-center rounded-lg border border-gray-200 py-2.5" onPress={markAllAsRead}>
            <Text className="text-sm font-semibold text-gray-500">すべて既読にする</Text>
          </TouchableOpacity>

          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={
              incomingMeetRequests.length > 0 ? (
                <View className="mx-4 mb-2">
                  <Text className="mb-2 text-sm font-bold text-gray-700">デート申込</Text>
                  {incomingMeetRequests.map((item) => (
                    <SectionCard
                      key={item.request_id}
                      style={{ borderRadius: 12, padding: 14, marginBottom: 8, backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a" }}
                    >
                      <Text className="mb-2 text-sm text-gray-800">
                        {item.from_display_name} さんから {item.scheduled_date} {item.scheduled_time}
                      </Text>
                      <TouchableOpacity className="mb-2" onPress={() => router.push(`/chat/${item.from_user_id}`)}>
                        <Text className="text-sm font-semibold text-blue-600">チャットを開く</Text>
                      </TouchableOpacity>
                      {item.status === "pending" ? (
                        <ActionButtonRow style={{ gap: 8 }}>
                          <ActionButton
                            label="承諾"
                            style={{ flex: 1, backgroundColor: "#22c55e", borderRadius: 8, paddingVertical: 10, alignItems: "center" }}
                            textStyle={{ color: "#fff", fontSize: 14, fontWeight: "700" }}
                            onPress={() => handleMeetDecision(item.request_id, "accept")}
                          />
                          <ActionButton
                            label="却下"
                            variant="danger"
                            style={{ flex: 1, backgroundColor: "#ef4444", borderRadius: 8, paddingVertical: 10, alignItems: "center" }}
                            textStyle={{ color: "#fff", fontSize: 14, fontWeight: "700" }}
                            onPress={() => handleMeetDecision(item.request_id, "reject")}
                          />
                        </ActionButtonRow>
                      ) : (
                        <Text className="text-xs text-gray-500">{item.status === "accepted" ? "承諾済み" : "却下済み"}</Text>
                      )}
                    </SectionCard>
                  ))}
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                className={`mx-4 mb-2 rounded-xl border p-3.5 ${item.isRead ? "border-gray-100 bg-gray-50" : "border-red-100 bg-red-50"}`}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.8}
              >
                <View className="mb-1.5 flex-row items-center">
                  <View className={`rounded-full px-2 py-0.5 ${getBadgeClass(item.type)}`}>
                    <Text className="text-xs font-bold text-white">{getNotificationTypeLabel(item.type)}</Text>
                  </View>
                </View>
                <Text className="mb-0.5 text-sm font-semibold text-gray-800">{buildPrimaryText(item)}</Text>
                {buildSecondaryText(item) ? <Text className="mb-1 text-xs text-gray-500">{buildSecondaryText(item)}</Text> : null}
                {(item.type === "like" || item.type === "match" || item.type === "match_expired") && item.targetUserId ? (
                  <ActionButtonRow style={{ gap: 8, marginTop: 8 }}>
                    <ActionButton
                      label="プロフィールを見る"
                      variant="secondary"
                      style={{ borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#e5e7eb" }}
                      textStyle={{ fontSize: 12, color: "#374151", fontWeight: "700" }}
                      onPress={() => openTargetProfile(item)}
                    />
                    {item.type === "match_expired" && (
                      <ActionButton
                        label="もう一度いいねを送る"
                        style={{ borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "#e74c3c" }}
                        textStyle={{ fontSize: 12, color: "#fff", fontWeight: "700" }}
                        onPress={() => handleRelike(item)}
                      />
                    )}
                  </ActionButtonRow>
                ) : null}
                <Text className="mt-1 text-xs text-gray-400">{new Date(item.createdAt).toLocaleString("ja-JP")}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <EmptyState
                message="通知はありません"
                containerStyle={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 80 }}
                textStyle={{ fontSize: 14, color: "#9ca3af", textAlign: "center" }}
              />
            }
          />
        </View>
      );
    }
    """

    CALL_TICKET = r"""import React, { useCallback, useEffect, useState } from "react";
    import { Alert, FlatList, Text, TextInput, View } from "react-native";
    import { useRouter } from "expo-router";
    import { ActionButton } from "../../components/common/ActionButton";
    import { EmptyState } from "../../components/common/EmptyState";
    import { LoadingState } from "../../components/common/LoadingState";
    import { SectionCard } from "../../components/common/SectionCard";
    import { SegmentedTab } from "../../components/common/SegmentedTab";
    import { ScreenBackButton } from "../../components/common/ScreenBackButton";
    import apiClient from "../../services/api";
    import {
      CallTicketCreateErrorDetail,
      CallTicketItem,
      CallTicketPurchaseResponse,
      CallTicketUseResponse,
      PurchasedTicketItem,
    } from "../../types/call-ticket";
    import { UserProfile } from "../../types/profile";
    import { formatRankProgressLabel } from "../../utils/rankProgress";

    const CALL_TICKET_TABS = [
      { key: "available", label: "購入可能" },
      { key: "purchased", label: "所有済み" },
      { key: "sell", label: "販売する" },
    ] as const;

    export function CallTicketScreen() {
      const router = useRouter();
      const [tab, setTab] = useState<"available" | "purchased" | "sell">("available");
      const [availableTickets, setAvailableTickets] = useState<CallTicketItem[]>([]);
      const [purchasedTickets, setPurchasedTickets] = useState<PurchasedTicketItem[]>([]);
      const [myProfile, setMyProfile] = useState<Pick<UserProfile, "gender" | "rank" | "rankProgress"> | null>(null);
      const [loading, setLoading] = useState(true);
      const [duration, setDuration] = useState("30");
      const [price, setPrice] = useState("500");
      const [creating, setCreating] = useState(false);

      const fetchData = useCallback(async () => {
        try {
          setLoading(true);
          const [availableResponse, purchasedResponse, profileResponse] = await Promise.all([
            apiClient.get<CallTicketItem[]>("/call-tickets/available"),
            apiClient.get<PurchasedTicketItem[]>("/call-tickets/my-purchases"),
            apiClient.get<UserProfile>("/users/me").catch(() => ({ data: null })),
          ]);
          setAvailableTickets(availableResponse.data || []);
          setPurchasedTickets(purchasedResponse.data || []);
          setMyProfile(
            profileResponse?.data
              ? { gender: profileResponse.data.gender, rank: Number(profileResponse.data.rank || 1), rankProgress: profileResponse.data.rankProgress }
              : null,
          );
        } catch (error) {
          console.error("Failed to fetch call tickets:", error);
          setAvailableTickets([]);
          setPurchasedTickets([]);
          setMyProfile(null);
        } finally {
          setLoading(false);
        }
      }, []);

      useEffect(() => {
        fetchData();
      }, [fetchData]);

      const currentRank = Number(myProfile?.rank || 1);
      const canSellByGender = (myProfile?.gender || "") === "male";
      const canSell = canSellByGender && currentRank >= 5;

      const handlePurchase = (ticket: CallTicketItem) => {
        Alert.alert(
          "購入確認",
          `${ticket.seller_name} の ${ticket.ticket_duration_minutes}分通話を購入しますか？`,
          [
            { text: "キャンセル" },
            {
              text: "購入する",
              onPress: async () => {
                try {
                  await apiClient.post<CallTicketPurchaseResponse>(`/call-tickets/purchase/${ticket.id}`);
                  await fetchData();
                } catch (error: any) {
                  Alert.alert("エラー", error?.response?.data?.detail || "購入に失敗しました");
                }
              },
            },
          ],
        );
      };

      const handleUse = async (purchaseId: number) => {
        try {
          await apiClient.post<CallTicketUseResponse>(`/call-tickets/use/${purchaseId}`);
          await fetchData();
        } catch (error: any) {
          Alert.alert("エラー", error?.response?.data?.detail || "使用処理に失敗しました");
        }
      };

      const handleCreate = async () => {
        if (!canSellByGender) {
          Alert.alert("販売条件未達", "通話チケット販売は男性ユーザーのみ利用できます");
          return;
        }
        if (currentRank < 5) {
          const progressText = formatRankProgressLabel(myProfile?.rankProgress);
          Alert.alert(
            "販売条件未達",
            progressText
              ? `通話チケット販売はRank5以上で解放されます。\n\n次ランク条件: ${progressText}`
              : "通話チケット販売はRank5以上で解放されます。",
            [
              { text: "閉じる", style: "cancel" },
              { text: "次ランク条件を見る", onPress: () => router.push("/(tabs)/profile?focus=rank") },
            ],
          );
          return;
        }
        const durationNum = parseInt(duration, 10);
        const priceNum = parseInt(price, 10);
        if (!durationNum || durationNum <= 0) {
          Alert.alert("入力エラー", "通話時間を正しく入力してください");
          return;
        }
        if (!priceNum || priceNum <= 0) {
          Alert.alert("入力エラー", "価格を正しく入力してください");
          return;
        }
        try {
          setCreating(true);
          await apiClient.post("/call-tickets/create", { ticket_duration_minutes: durationNum, price_jpy: priceNum });
          Alert.alert("作成完了", "通話チケットを作成しました");
          setDuration("30");
          setPrice("500");
          await fetchData();
          setTab("available");
        } catch (error: any) {
          const rawDetail = error?.response?.data?.detail;
          const detailObj: CallTicketCreateErrorDetail | null = rawDetail && typeof rawDetail === "object" ? rawDetail : null;
          const baseMessage = (typeof rawDetail === "string" ? rawDetail : detailObj?.message) || "チケット作成に失敗しました";
          const progressText = formatRankProgressLabel(detailObj?.rankProgress);
          if (error?.response?.status === 403 && detailObj?.requiredRank === 5) {
            Alert.alert(
              "ランク条件未達",
              progressText ? `${baseMessage}\n\n次ランク条件: ${progressText}` : baseMessage,
              [
                { text: "閉じる", style: "cancel" },
                { text: "次ランク条件を見る", onPress: () => router.push("/(tabs)/profile?focus=rank") },
              ],
            );
          } else {
            Alert.alert("エラー", baseMessage);
          }
        } finally {
          setCreating(false);
        }
      };

      const inputStyle = {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 15,
        color: "#111827",
        backgroundColor: "#f9fafb",
        marginBottom: 12,
      };

      return (
        <View className="flex-1 bg-white">
          <View className="border-b border-gray-100 px-4 pt-5 pb-3">
            <ScreenBackButton onPress={() => router.back()} style={{ paddingRight: 12 }} />
            <Text className="mb-1 text-2xl font-bold text-gray-900">📞 通話チケット</Text>
            <Text className="text-sm text-gray-500">チケットの購入・使用・販売ができます</Text>
          </View>

          <SegmentedTab
            items={CALL_TICKET_TABS}
            value={tab}
            onChange={setTab}
            containerStyle={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" }}
            itemStyle={{ flex: 1, alignItems: "center", paddingVertical: 10 }}
            activeItemStyle={{ borderBottomWidth: 2, borderBottomColor: "#2563eb" }}
            textStyle={{ color: "#6b7280", fontWeight: "700" }}
            activeTextStyle={{ color: "#2563eb" }}
          />

          {loading && tab !== "sell" ? (
            <LoadingState color="#2563eb" containerStyle={{ flex: 1, justifyContent: "center", alignItems: "center" }} />
          ) : tab === "available" ? (
            <FlatList
              data={availableTickets}
              keyExtractor={(item) => `${item.id}`}
              onRefresh={fetchData}
              refreshing={loading}
              renderItem={({ item }) => (
                <SectionCard style={{ marginHorizontal: 16, marginVertical: 6, borderRadius: 12, padding: 14, backgroundColor: "#f0f9ff", borderWidth: 1, borderColor: "#bae6fd" }}>
                  <View className="mb-1.5 flex-row items-center justify-between">
                    <Text className="text-xl font-bold text-blue-700">{item.ticket_duration_minutes}分</Text>
                    <Text className="text-base font-bold text-blue-600">¥{item.price_jpy.toLocaleString()}</Text>
                  </View>
                  <Text className="mb-3 text-sm text-gray-500">販売者: {item.seller_name}</Text>
                  <ActionButton
                    label="購入する"
                    style={{ backgroundColor: "#2563eb", borderRadius: 8, paddingVertical: 10, alignItems: "center" }}
                    textStyle={{ color: "#fff", fontSize: 14, fontWeight: "700" }}
                    onPress={() => handlePurchase(item)}
                  />
                </SectionCard>
              )}
              ListEmptyComponent={
                <EmptyState
                  message="購入可能なチケットはありません"
                  containerStyle={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 80 }}
                  textStyle={{ fontSize: 14, color: "#9ca3af", textAlign: "center" }}
                />
              }
            />
          ) : tab === "purchased" ? (
            <FlatList
              data={purchasedTickets}
              keyExtractor={(item) => `${item.purchase_id}`}
              onRefresh={fetchData}
              refreshing={loading}
              renderItem={({ item }) => (
                <SectionCard style={{ marginHorizontal: 16, marginVertical: 6, borderRadius: 12, padding: 14, backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb" }}>
                  <Text className="mb-1 text-base font-semibold text-gray-800">{item.seller_name}</Text>
                  <Text className="mb-0.5 text-sm text-gray-500">{item.ticket_duration_minutes}分 / ¥{item.amount_jpy.toLocaleString()}</Text>
                  <Text className="mb-3 text-sm text-gray-500">購入日: {new Date(item.purchased_at).toLocaleDateString("ja-JP")}</Text>
                  {item.is_used ? (
                    <View className="self-start rounded-full bg-gray-200 px-3 py-1">
                      <Text className="text-xs font-bold text-gray-500">使用済み</Text>
                    </View>
                  ) : (
                    <ActionButton
                      label="使用済みにする"
                      style={{ backgroundColor: "#7c3aed", borderRadius: 8, paddingVertical: 10, alignItems: "center" }}
                      textStyle={{ color: "#fff", fontSize: 14, fontWeight: "700" }}
                      onPress={() => handleUse(item.purchase_id)}
                    />
                  )}
                </SectionCard>
              )}
              ListEmptyComponent={
                <EmptyState
                  message="購入済みチケットはありません"
                  containerStyle={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 80 }}
                  textStyle={{ fontSize: 14, color: "#9ca3af", textAlign: "center" }}
                />
              }
            />
          ) : (
            <SectionCard style={{ margin: 16, borderRadius: 12, padding: 16, backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb" }}>
              <Text className="mb-4 text-base font-bold text-gray-900">通話チケットを販売する</Text>
              {canSell ? (
                <>
                  <Text className="mb-1.5 text-xs font-semibold text-gray-500">通話時間（分）</Text>
                  <TextInput
                    style={inputStyle}
                    value={duration}
                    onChangeText={setDuration}
                    keyboardType="number-pad"
                    placeholder="例: 30"
                    placeholderTextColor="#9ca3af"
                  />
                  <Text className="mb-1.5 text-xs font-semibold text-gray-500">価格（円）</Text>
                  <TextInput
                    style={inputStyle}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="number-pad"
                    placeholder="例: 500"
                    placeholderTextColor="#9ca3af"
                  />
                  <ActionButton
                    label={creating ? "作成中..." : "チケットを作成する"}
                    style={[
                      { backgroundColor: "#2563eb", borderRadius: 8, paddingVertical: 12, alignItems: "center" },
                      creating ? { opacity: 0.5 } : undefined,
                    ]}
                    textStyle={{ color: "#fff", fontSize: 15, fontWeight: "700" }}
                    disabled={creating}
                    onPress={handleCreate}
                  />
                </>
              ) : (
                <>
                  <Text className="mb-3 text-sm text-gray-500">
                    {canSellByGender ? `現在ランク: Rank ${currentRank}（Rank5で販売解放）` : "男性ユーザーのみ販売できます"}
                  </Text>
                  {canSellByGender && myProfile?.rankProgress && !myProfile.rankProgress.isMaxRank
                    ? myProfile.rankProgress.items.map((item) => {
                        const unit = item.unit || "";
                        return (
                          <Text key={item.key} className="mb-1 text-xs text-gray-400">
                            {item.done ? "✓" : "・"} {item.label} {item.currentValue}
                            {unit}/{item.requiredValue}
                            {unit}
                          </Text>
                        );
                      })
                    : null}
                  {canSellByGender && (
                    <ActionButton
                      label="次ランク条件を見る"
                      variant="neutral"
                      style={{ marginTop: 8, alignSelf: "flex-start", borderRadius: 8, backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#e5e7eb", paddingVertical: 8, paddingHorizontal: 12 }}
                      textStyle={{ fontSize: 12, color: "#374151", fontWeight: "700" }}
                      onPress={() => router.push("/(tabs)/profile?focus=rank")}
                    />
                  )}
                </>
              )}
            </SectionCard>
          )}
        </View>
      );
    }
    """

    GIFT = r"""import React, { useCallback, useEffect, useState } from "react";
    import { Alert, FlatList, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
    import { useLocalSearchParams, useRouter } from "expo-router";
    import { ActionButton } from "../../components/common/ActionButton";
    import { EmptyState } from "../../components/common/EmptyState";
    import { LoadingState } from "../../components/common/LoadingState";
    import { SectionCard } from "../../components/common/SectionCard";
    import { SegmentedTab } from "../../components/common/SegmentedTab";
    import { ScreenBackButton } from "../../components/common/ScreenBackButton";
    import apiClient from "../../services/api";
    import {
      GiftItem,
      GiftOpenResponse,
      GiftSendResponse,
      GiftSendRestrictionDetail,
      ReceivedGiftItem,
      SentGiftItem,
    } from "../../types/gift";
    import { formatRankProgressLabel } from "../../utils/rankProgress";

    const GIFT_TABS = [
      { key: "send", label: "送る" },
      { key: "received", label: "受取" },
      { key: "sent", label: "送信済み" },
    ] as const;

    export function GiftScreen() {
      const router = useRouter();
      const { recipientId: initialRecipientId } = useLocalSearchParams<{ recipientId?: string }>();
      const [tab, setTab] = useState<"send" | "received" | "sent">("send");
      const [loading, setLoading] = useState(true);
      const [sending, setSending] = useState(false);
      const [items, setItems] = useState<GiftItem[]>([]);
      const [received, setReceived] = useState<ReceivedGiftItem[]>([]);
      const [sent, setSent] = useState<SentGiftItem[]>([]);
      const [recipientId, setRecipientId] = useState("");
      const [selectedGiftId, setSelectedGiftId] = useState<number | null>(null);
      const [sendRestriction, setSendRestriction] = useState<GiftSendRestrictionDetail | null>(null);

      const fetchData = useCallback(async () => {
        try {
          setLoading(true);
          const [itemsResponse, receivedResponse, sentResponse] = await Promise.all([
            apiClient.get<GiftItem[]>("/gifts/items"),
            apiClient.get<ReceivedGiftItem[]>("/gifts/received"),
            apiClient.get<SentGiftItem[]>("/gifts/sent"),
          ]);
          setItems(itemsResponse.data || []);
          setReceived(receivedResponse.data || []);
          setSent(sentResponse.data || []);
        } catch (error) {
          console.error("Failed to fetch gift data:", error);
          setItems([]);
          setReceived([]);
          setSent([]);
        } finally {
          setLoading(false);
        }
      }, []);

      useEffect(() => {
        fetchData();
      }, [fetchData]);

      useEffect(() => {
        if (initialRecipientId) {
          setRecipientId(initialRecipientId);
          setTab("send");
        }
      }, [initialRecipientId]);

      useEffect(() => {
        setSendRestriction(null);
      }, [recipientId, selectedGiftId]);

      const handleSend = async () => {
        const parsedRecipientId = Number(recipientId);
        if (!Number.isFinite(parsedRecipientId) || parsedRecipientId <= 0) {
          Alert.alert("入力エラー", "受取ユーザーIDを正しく入力してください");
          return;
        }
        if (!selectedGiftId) {
          Alert.alert("入力エラー", "ギフトを選択してください");
          return;
        }

        try {
          setSending(true);
          await apiClient.post<GiftSendResponse>("/gifts/send", {
            recipient_id: parsedRecipientId,
            gift_item_id: selectedGiftId,
          });
          setSendRestriction(null);
          Alert.alert("送信完了", "ギフトを送りました");
          setRecipientId("");
          setSelectedGiftId(null);
          await fetchData();
          setTab("sent");
        } catch (error: any) {
          const detail = error?.response?.data?.detail;
          if (
            error?.response?.status === 403 &&
            detail &&
            typeof detail === "object" &&
            typeof detail.message === "string"
          ) {
            setSendRestriction(detail as GiftSendRestrictionDetail);
            return;
          }
          Alert.alert("エラー", detail || "ギフト送信に失敗しました");
        } finally {
          setSending(false);
        }
      };

      const handleOpenGift = async (giftId: number) => {
        try {
          await apiClient.post<GiftOpenResponse>(`/gifts/open/${giftId}`);
          await fetchData();
        } catch (error: any) {
          Alert.alert("エラー", error?.response?.data?.detail || "ギフト開封に失敗しました");
        }
      };

      const renderGiftLabel = (name: string) => {
        const parts = name.split(" ");
        return {
          emoji: parts[0] || "🎁",
          label: parts.slice(1).join(" ") || name,
        };
      };

      return (
        <View className="flex-1 bg-white">
          <View className="border-b border-gray-100 px-4 pt-5 pb-3">
            <ScreenBackButton onPress={() => router.back()} style={{ paddingRight: 12 }} />
            <Text className="mb-1 text-2xl font-bold text-gray-900">🎁 ギフト</Text>
            <Text className="text-sm text-gray-500">ギフト送信・受信履歴を管理できます</Text>
          </View>

          <SegmentedTab
            items={GIFT_TABS}
            value={tab}
            onChange={setTab}
            containerStyle={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" }}
            itemStyle={{ flex: 1, alignItems: "center", paddingVertical: 10 }}
            activeItemStyle={{ borderBottomWidth: 2, borderBottomColor: "#ec4899" }}
            textStyle={{ color: "#6b7280", fontWeight: "700" }}
            activeTextStyle={{ color: "#ec4899" }}
          />

          {loading ? (
            <LoadingState color="#ec4899" containerStyle={{ flex: 1, justifyContent: "center", alignItems: "center" }} />
          ) : tab === "send" ? (
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Text className="mb-1.5 text-xs font-semibold text-gray-500">受取ユーザーID</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: "#111827", backgroundColor: "#f9fafb", marginBottom: 16 }}
                value={recipientId}
                onChangeText={setRecipientId}
                keyboardType="number-pad"
                placeholder="例: 5"
                placeholderTextColor="#9ca3af"
              />
              <Text className="mb-2 text-sm font-semibold text-gray-700">ギフトを選択</Text>
              <View className="mb-4 flex-row flex-wrap gap-2">
                {items.map((item) => {
                  const parsed = renderGiftLabel(item.name);
                  const isSelected = selectedGiftId === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      className="items-center rounded-xl border p-3"
                      style={{ width: "30%", backgroundColor: isSelected ? "#fdf2f8" : "#f9fafb", borderColor: isSelected ? "#ec4899" : "#e5e7eb" }}
                      onPress={() => setSelectedGiftId(item.id)}
                    >
                      <Text style={{ fontSize: 28 }}>{parsed.emoji}</Text>
                      <Text className="mt-1 text-center text-xs font-semibold text-gray-700">{parsed.label}</Text>
                      <Text className={`mt-0.5 text-xs font-bold ${isSelected ? "text-pink-600" : "text-gray-500"}`}>
                        ¥{item.price_jpy.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {sendRestriction && (
                <SectionCard style={{ borderRadius: 12, padding: 14, marginBottom: 12, backgroundColor: "#fff1f2", borderWidth: 1, borderColor: "#fecdd3" }}>
                  <Text className="mb-1 text-sm font-bold text-red-600">送信できません</Text>
                  <Text className="mb-1 text-sm text-gray-700">{sendRestriction.message}</Text>
                  {sendRestriction.requiredRank && sendRestriction.currentRank ? (
                    <Text className="mb-1 text-xs text-gray-500">
                      相手ランク: Rank{sendRestriction.currentRank} / 必要: Rank{sendRestriction.requiredRank}
                    </Text>
                  ) : null}
                  {sendRestriction.requiredGender ? (
                    <Text className="mb-1 text-xs text-gray-500">
                      対象性別: {sendRestriction.requiredGender === "female" ? "女性" : "指定あり"}
                      {sendRestriction.recipientGender
                        ? ` / 相手: ${sendRestriction.recipientGender === "female" ? "女性" : sendRestriction.recipientGender === "male" ? "男性" : sendRestriction.recipientGender}`
                        : ""}
                    </Text>
                  ) : null}
                  {formatRankProgressLabel(sendRestriction.rankProgress) ? (
                    <Text className="mb-2 text-xs text-gray-500">次ランク目安: {formatRankProgressLabel(sendRestriction.rankProgress)}</Text>
                  ) : null}
                  {sendRestriction.recipientId ? (
                    <ActionButton
                      label="相手プロフィールを見る"
                      variant="neutral"
                      onPress={() =>
                        router.push({
                          pathname: "/user/[id]",
                          params: { id: String(sendRestriction.recipientId) },
                        })
                      }
                      style={{ alignSelf: "flex-start", borderRadius: 8, backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#e5e7eb", paddingVertical: 8, paddingHorizontal: 12 }}
                      textStyle={{ fontSize: 12, color: "#374151", fontWeight: "700" }}
                    />
                  ) : null}
                </SectionCard>
              )}
              <ActionButton
                label={sending ? "送信中..." : "ギフトを送る"}
                onPress={handleSend}
                disabled={sending}
                style={[
                  { backgroundColor: "#ec4899", borderRadius: 8, paddingVertical: 12, alignItems: "center" },
                  sending ? { opacity: 0.5 } : undefined,
                ]}
                textStyle={{ color: "#fff", fontSize: 15, fontWeight: "700" }}
              />
            </ScrollView>
          ) : tab === "received" ? (
            <FlatList
              data={received}
              keyExtractor={(item) => item.id.toString()}
              onRefresh={fetchData}
              refreshing={loading}
              renderItem={({ item }) => {
                const parsed = renderGiftLabel(item.gift_name);
                return (
                  <SectionCard style={{ marginHorizontal: 16, marginVertical: 6, borderRadius: 12, padding: 14, backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb" }}>
                    <TouchableOpacity className="flex-row items-center" onPress={() => { if (!item.is_opened) { handleOpenGift(item.id); } }}>
                      <Text style={{ fontSize: 36, marginRight: 12 }}>{parsed.emoji}</Text>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-gray-800">{parsed.label}</Text>
                        <Text className="text-sm text-gray-500">from {item.sender_name}</Text>
                        <Text className="text-sm font-semibold text-pink-600">¥{item.price_jpy.toLocaleString()}</Text>
                        <Text className="text-xs text-gray-400">{new Date(item.sent_at).toLocaleString("ja-JP")}</Text>
                      </View>
                      {!item.is_opened && (
                        <View className="rounded-full bg-pink-500 px-2.5 py-1">
                          <Text className="text-xs font-bold text-white">未開封</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </SectionCard>
                );
              }}
              ListEmptyComponent={
                <EmptyState
                  message="受け取ったギフトはありません"
                  containerStyle={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 80 }}
                  textStyle={{ fontSize: 14, color: "#9ca3af", textAlign: "center" }}
                />
              }
            />
          ) : (
            <FlatList
              data={sent}
              keyExtractor={(item) => item.id.toString()}
              onRefresh={fetchData}
              refreshing={loading}
              renderItem={({ item }) => {
                const parsed = renderGiftLabel(item.gift_name);
                return (
                  <SectionCard style={{ marginHorizontal: 16, marginVertical: 6, borderRadius: 12, padding: 14, backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb" }}>
                    <View className="flex-row items-center">
                      <Text style={{ fontSize: 36, marginRight: 12 }}>{parsed.emoji}</Text>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-gray-800">{parsed.label}</Text>
                        <Text className="text-sm text-gray-500">to {item.recipient_name}</Text>
                        <Text className="text-sm font-semibold text-pink-600">¥{item.price_jpy.toLocaleString()}</Text>
                        <Text className="text-xs text-gray-400">{new Date(item.sent_at).toLocaleString("ja-JP")}</Text>
                      </View>
                      <View className={`rounded-full px-2.5 py-1 ${item.is_opened ? "bg-gray-200" : "bg-pink-500"}`}>
                        <Text className={`text-xs font-bold ${item.is_opened ? "text-gray-500" : "text-white"}`}>
                          {item.is_opened ? "開封済み" : "未開封"}
                        </Text>
                      </View>
                    </View>
                  </SectionCard>
                );
              }}
              ListEmptyComponent={
                <EmptyState
                  message="送信したギフトはありません"
                  containerStyle={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 80 }}
                  textStyle={{ fontSize: 14, color: "#9ca3af", textAlign: "center" }}
                />
              }
            />
          )}
        </View>
      );
    }
    """

    write("live/LiveScreen.tsx", LIVE)
    write("notification/NotificationScreen.tsx", NOTIF)
    write("call-ticket/CallTicketScreen.tsx", CALL_TICKET)
    write("gift/GiftScreen.tsx", GIFT)
    print("All done!")
