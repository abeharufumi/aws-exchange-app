#!/usr/bin/env python3
"""Rewrite TimelineScreen, MatchesScreen, LiveScreen to use className."""
import os

BASE = "/Users/abeharufumi/Projects/aws-exchange-app/frontend/src/screens"


def write(path, content):
    full = os.path.join(BASE, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w") as f:
        f.write(content)
    print(f"Written: {path}")


# ─── TimelineScreen ────────────────────────────────────────────────────────────
write(
    "home/TimelineScreen.tsx",
    """\
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  PanResponder,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ActionButton } from "../../components/common/ActionButton";
import { EmptyState } from "../../components/common/EmptyState";
import { LoadingState } from "../../components/common/LoadingState";
import apiClient from "../../services/api";
import { LikeActionResponse, PassActionResponse } from "../../types/match";
import { formatRankProgressLabel } from "../../utils/rankProgress";
import { UserCard } from "../../types/user";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_OUT_DURATION = 250;

const cardBaseStyle = {
  position: "absolute" as const,
  width: "100%" as const,
  borderRadius: 16,
  padding: 24,
  backgroundColor: "#fff",
  shadowColor: "#000",
  shadowOpacity: 0.15,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 6,
};

export function TimelineScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isAnimatingRef = useRef(false);
  const position = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    position.setValue({ x: 0, y: 0 });
    isAnimatingRef.current = false;
  }, [currentIndex, position]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<UserCard[]>("/users/discover");
      setUsers(response.data);
      setCurrentIndex(0);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getRequestStatusLabel = (status?: string): string | null => {
    if (status === "pending") return "依頼中";
    if (status === "matched") return "マッチ済み";
    if (status === "passed") return "以前にパス";
    return null;
  };

  const isLikeBlocked = (status?: string): boolean => {
    return status === "pending" || status === "matched";
  };

  const submitAction = async (action: "like" | "pass", targetUserId: number) => {
    try {
      if (action === "like") {
        const response = await apiClient.post<LikeActionResponse>("/matches/like", {
          target_user_id: targetUserId,
        });
        if (response.data?.status === "matched") {
          Alert.alert("マッチ成立", response.data?.message || "お互いにいいねしました！");
        } else if (response.data?.status === "already_pending") {
          Alert.alert("依頼中", response.data?.message || "このユーザーには既にいいねを送信済みです");
        } else if (response.data?.status === "already_matched") {
          Alert.alert("マッチ済み", response.data?.message || "このユーザーとは既にマッチしています");
        } else if (response.data?.status === "blocked_by_filter") {
          const detail = response.data;
          const progressText = formatRankProgressLabel(detail.rankProgress);
          const message = detail.message || "相手の受信フィルターにより、いいねを送れませんでした";
          Alert.alert(
            "送信不可",
            progressText
              ? `${message}\\n\\n次ランク条件: ${progressText}`
              : `${message}${
                  detail.requiredRank && detail.senderRank
                    ? `\\n現在ランク: Rank${detail.senderRank} / 必要ランク: Rank${detail.requiredRank}`
                    : ""
                }`,
            [
              { text: "閉じる", style: "cancel" },
              { text: "次ランク条件を見る", onPress: () => router.push("/(tabs)/profile?focus=rank") },
            ],
          );
        }
      } else {
        await apiClient.post<PassActionResponse>("/matches/pass", { target_user_id: targetUserId });
      }
    } catch (error) {
      console.error("Failed to submit action:", error);
    } finally {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const resetPosition = () => {
    Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
  };

  const swipeCard = (action: "like" | "pass", dy = 0) => {
    if (isAnimatingRef.current) return;
    const targetUser = users[currentIndex];
    const targetUserId = targetUser?.id;
    if (!targetUserId) return;

    if (action === "like" && isLikeBlocked(targetUser?.requestStatus)) {
      Alert.alert(
        "Like不可",
        targetUser?.requestStatus === "pending"
          ? "このユーザーには既に依頼中です"
          : "このユーザーとは既にマッチ済みです",
      );
      resetPosition();
      return;
    }

    isAnimatingRef.current = true;
    Animated.timing(position, {
      toValue: { x: action === "like" ? SCREEN_WIDTH : -SCREEN_WIDTH, y: dy },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      submitAction(action, targetUserId);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: position.x, dy: position.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_event, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeCard("like", gesture.dy);
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeCard("pass", gesture.dy);
        } else {
          resetPosition();
        }
      },
    }),
  ).current;

  if (loading) return <LoadingState color="#e74c3c" />;

  if (currentIndex >= users.length) {
    return (
      <View className="flex-1 bg-black px-5 pt-6 pb-8 justify-center items-center gap-4">
        <EmptyState
          message="ユーザーがいません"
          containerStyle={{ paddingVertical: 0 }}
          textStyle={{ fontSize: 18, color: "#fff" }}
        />
        <ActionButton
          label="リロード"
          style={{ backgroundColor: "#e74c3c", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24, flex: 0 }}
          textStyle={{ color: "#fff", fontSize: 16, fontWeight: "600" }}
          onPress={fetchUsers}
        />
      </View>
    );
  }

  const currentUser = users[currentIndex];
  const nextUser = users[currentIndex + 1];
  const currentRelationLabel = getRequestStatusLabel(currentUser.requestStatus);
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ["-12deg", "0deg", "12deg"],
  });
  const animatedCardStyle = { transform: [...position.getTranslateTransform(), { rotate }] };

  const statusColorClass =
    currentUser.requestStatus === "pending"
      ? "text-amber-700"
      : currentUser.requestStatus === "matched"
        ? "text-green-800"
        : "text-gray-500";

  return (
    <View className="flex-1 bg-black px-5 pt-6 pb-8 justify-center">
      <View className="flex-1 justify-center">
        <View className="relative justify-center" style={{ height: 320 }}>
          {nextUser && (
            <View style={[cardBaseStyle, { transform: [{ scale: 0.96 }], opacity: 0.7 }]}>
              <Text className="text-2xl font-bold mb-3 text-gray-900">
                {nextUser.displayName}{nextUser.age ? `, ${nextUser.age}` : ""}
              </Text>
              <Text className="text-xs font-semibold text-gray-700 mb-1.5">
                ⭐ {Number(nextUser.reviewAvg || 0).toFixed(2)} / Rank {nextUser.rank || 1}
              </Text>
              <Text className="text-base text-gray-500">{nextUser.bio || ""}</Text>
            </View>
          )}
          <Animated.View style={[cardBaseStyle, animatedCardStyle]} {...panResponder.panHandlers}>
            <Text className="text-2xl font-bold mb-3 text-gray-900">
              {currentUser.displayName}{currentUser.age ? `, ${currentUser.age}` : ""}
            </Text>
            <Text className="text-xs font-semibold text-gray-700 mb-1.5">
              ⭐ {Number(currentUser.reviewAvg || 0).toFixed(2)} / Rank {currentUser.rank || 1}
            </Text>
            {currentRelationLabel && (
              <Text className={`text-xs font-bold mb-1.5 ${statusColorClass}`}>
                {currentRelationLabel}
              </Text>
            )}
            <Text className="text-base text-gray-500">{currentUser.bio || ""}</Text>
          </Animated.View>
        </View>
      </View>

      <View className="flex-row justify-center gap-6 mt-3">
        <TouchableOpacity
          className="w-16 h-16 rounded-full justify-center items-center"
          style={{ backgroundColor: "#3a3a3a" }}
          onPress={() => swipeCard("pass")}
        >
          <Text className="text-2xl text-white">✕</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="w-16 h-16 rounded-full justify-center items-center"
          style={{ backgroundColor: isLikeBlocked(currentUser.requestStatus) ? "#9ca3af" : "#e74c3c" }}
          onPress={() => swipeCard("like")}
          disabled={isLikeBlocked(currentUser.requestStatus)}
        >
          <Text className="text-2xl text-white">♥</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
""",
)

# ─── MatchesScreen ─────────────────────────────────────────────────────────────
write(
    "matches/MatchesScreen.tsx",
    """\
import React, { useEffect, useState } from "react";
import { Alert, FlatList, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ActionButton } from "../../components/common/ActionButton";
import { ActionButtonRow } from "../../components/common/ActionButtonRow";
import { EmptyState } from "../../components/common/EmptyState";
import { LoadingState } from "../../components/common/LoadingState";
import apiClient from "../../services/api";
import {
  IncomingLikeAcceptResponse,
  IncomingLikeItem,
  IncomingLikeRejectResponse,
  LikeActionResponse,
  MatchListItem,
  OutgoingLikeItem,
} from "../../types/match";
import { formatRankProgressLabel } from "../../utils/rankProgress";

export function MatchesScreen() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchListItem[]>([]);
  const [incomingLikes, setIncomingLikes] = useState<IncomingLikeItem[]>([]);
  const [outgoingLikes, setOutgoingLikes] = useState<OutgoingLikeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingLikeBackUserId, setProcessingLikeBackUserId] = useState<number | null>(null);
  const [processingPassUserId, setProcessingPassUserId] = useState<number | null>(null);
  const isIncomingActionBusy = processingLikeBackUserId !== null || processingPassUserId !== null;

  useEffect(() => { fetchMatches(); }, []);

  const fetchMatches = async () => {
    try {
      const [matchedResponse, incomingResponse, outgoingResponse] = await Promise.all([
        apiClient.get<MatchListItem[]>("/matches"),
        apiClient.get<IncomingLikeItem[]>("/matches/requests/incoming"),
        apiClient.get<OutgoingLikeItem[]>("/matches/requests/outgoing"),
      ]);
      setMatches(matchedResponse.data || []);
      setIncomingLikes(incomingResponse.data || []);
      setOutgoingLikes(outgoingResponse.data || []);
    } catch (error) {
      console.error("Failed to fetch matches:", error);
      setMatches([]); setIncomingLikes([]); setOutgoingLikes([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try { await fetchMatches(); } finally { setRefreshing(false); }
  };

  const formatDateTime = (raw?: string) => {
    if (!raw) return "";
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  const getLastLoginLabel = (raw?: string) => {
    if (!raw) return "最終ログイン: 未ログイン";
    const formatted = formatDateTime(raw);
    return formatted ? `最終ログイン: ${formatted}` : "最終ログイン: 不明";
  };

  const getRemainingDaysLabel = (createdAt: string, status: string) => {
    if (status === "expired") return "期限切れ";
    const created = new Date(createdAt);
    if (Number.isNaN(created.getTime())) return "期限未計算";
    const expiresAt = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000);
    const diffMs = expiresAt.getTime() - Date.now();
    const remainingDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    if (remainingDays <= 0) return "今日まで";
    if (remainingDays === 1) return "あと1日";
    return `あと${remainingDays}日`;
  };

  const isDeadlineSoon = (createdAt: string, status: string) => {
    if (status !== "pending") return false;
    const created = new Date(createdAt);
    if (Number.isNaN(created.getTime())) return false;
    const expiresAt = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000);
    return Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)) <= 2;
  };

  const handleRelike = async (targetUserId: number) => {
    try {
      const response = await apiClient.post<LikeActionResponse>("/matches/like", { target_user_id: targetUserId });
      if (response.data?.status === "matched") {
        Alert.alert("マッチ成立", response.data?.message || "お互いにいいねしました！");
      } else if (response.data?.status === "already_pending") {
        Alert.alert("依頼中", response.data?.message || "このユーザーには既に依頼中です");
      } else if (response.data?.status === "already_matched") {
        Alert.alert("マッチ済み", response.data?.message || "このユーザーとは既にマッチしています");
      } else if (response.data?.status === "blocked_by_filter") {
        const detail = response.data;
        const progressText = formatRankProgressLabel(detail.rankProgress);
        const message = detail.message || "相手の受信フィルターにより、いいねを送れませんでした";
        Alert.alert(
          "送信不可",
          progressText
            ? `${message}\\n\\n次ランク条件: ${progressText}`
            : `${message}${detail.requiredRank && detail.senderRank ? `\\n現在ランク: Rank${detail.senderRank} / 必要ランク: Rank${detail.requiredRank}` : ""}`,
          [
            { text: "閉じる", style: "cancel" },
            { text: "次ランク条件を見る", onPress: () => router.push("/(tabs)/profile?focus=rank") },
          ],
        );
      } else {
        Alert.alert("完了", response.data?.message || "いいねを再送しました");
      }
      fetchMatches();
    } catch (error) {
      console.error("Failed to relike:", error);
      Alert.alert("エラー", "再依頼に失敗しました");
    }
  };

  const handleLikeBack = async (requestId: number, sourceUserId: number) => {
    if (processingLikeBackUserId !== null || processingPassUserId !== null) return;
    try {
      setProcessingLikeBackUserId(sourceUserId);
      const response = await apiClient.post<IncomingLikeAcceptResponse>(`/matches/requests/${requestId}/accept`);
      if (response.data?.status === "matched") {
        Alert.alert("マッチ成立", response.data?.message || "お互いにいいねしました！");
      } else if (response.data?.status === "already_processed") {
        Alert.alert("処理済み", response.data?.message || "このいいねは既に処理済みです");
      } else {
        Alert.alert("完了", response.data?.message || "承諾しました");
      }
      await fetchMatches();
    } catch (error) {
      console.error("Failed to like back:", error);
      Alert.alert("エラー", "承諾に失敗しました");
    } finally { setProcessingLikeBackUserId(null); }
  };

  const handlePassIncoming = async (requestId: number, sourceUserId: number) => {
    if (isIncomingActionBusy) return;
    try {
      setProcessingPassUserId(sourceUserId);
      const response = await apiClient.post<IncomingLikeRejectResponse>(`/matches/requests/${requestId}/reject`);
      if (response.data?.status === "already_processed") {
        Alert.alert("処理済み", response.data?.message || "この依頼は既に処理されています");
      } else {
        Alert.alert("完了", response.data?.message || "見送りました");
      }
      await fetchMatches();
    } catch (error) {
      console.error("Failed to pass incoming like:", error);
      Alert.alert("エラー", "見送りに失敗しました");
    } finally { setProcessingPassUserId(null); }
  };

  if (loading) return <LoadingState color="#e74c3c" />;

  const btnDisabledStyle = isIncomingActionBusy ? { opacity: 0.55 } : undefined;
  const btnTextDisabledStyle = isIncomingActionBusy ? { color: "#f3f4f6" } : undefined;

  return (
    <View className="flex-1 bg-white p-4">
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <>
            {incomingLikes.length > 0 ? (
              <View className="mb-3">
                <Text className="text-base font-bold text-gray-800 mb-2">受信したいいね</Text>
                {incomingLikes.map((item) => (
                  <View
                    key={item.requestId}
                    className="rounded-xl p-3.5 mb-2 border"
                    style={
                      isDeadlineSoon(item.createdAt, "pending")
                        ? { backgroundColor: "#fff7ed", borderColor: "#fdba74" }
                        : { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }
                    }
                  >
                    <Text className="text-lg font-bold text-gray-900 mb-1">
                      {item.displayName || "Unknown"}{item.age ? `, ${item.age}` : ""}
                    </Text>
                    <Text className="text-sm text-gray-500 mb-1.5">
                      {item.location || "場所未設定"}{item.rank ? ` / Rank ${item.rank}` : ""}
                    </Text>
                    <Text className="text-xs text-gray-500 font-semibold mb-1.5">{getLastLoginLabel(item.lastLoginAt)}</Text>
                    <Text className="text-sm text-gray-600 mb-2">{item.bio || "自己紹介はありません"}</Text>
                    <Text
                      className="text-xs font-bold mb-1.5"
                      style={{ color: isDeadlineSoon(item.createdAt, "pending") ? "#dc2626" : "#2563eb" }}
                    >
                      期限: {getRemainingDaysLabel(item.createdAt, "pending")}
                    </Text>
                    <Text className="text-xs text-gray-400 mb-2.5">{formatDateTime(item.createdAt)}</Text>
                    <ActionButtonRow>
                      <ActionButton
                        label="プロフィールを見る"
                        variant="secondary"
                        style={[{ backgroundColor: "#6b7280", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }, btnDisabledStyle]}
                        textStyle={[{ color: "#fff", fontWeight: "700", fontSize: 13 }, btnTextDisabledStyle]}
                        onPress={() => router.push(`/user/${item.sourceUserId}`)}
                        disabled={isIncomingActionBusy}
                      />
                      <ActionButton
                        label={processingLikeBackUserId === item.sourceUserId ? "処理中..." : "いいねを返す"}
                        style={[{ backgroundColor: "#2563eb", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }, btnDisabledStyle]}
                        textStyle={[{ color: "#fff", fontWeight: "700", fontSize: 13 }, btnTextDisabledStyle]}
                        onPress={() => handleLikeBack(item.requestId, item.sourceUserId)}
                        disabled={isIncomingActionBusy}
                      />
                      <ActionButton
                        label={processingPassUserId === item.sourceUserId ? "処理中..." : "見送る"}
                        variant="danger"
                        style={[{ backgroundColor: "#6b7280", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }, btnDisabledStyle]}
                        textStyle={[{ color: "#fff", fontWeight: "700", fontSize: 13 }, btnTextDisabledStyle]}
                        onPress={() => handlePassIncoming(item.requestId, item.sourceUserId)}
                        disabled={isIncomingActionBusy}
                      />
                    </ActionButtonRow>
                  </View>
                ))}
              </View>
            ) : null}

            {outgoingLikes.length > 0 ? (
              <View className="mb-3">
                <Text className="text-base font-bold text-gray-800 mb-2">送信中のいいね</Text>
                {outgoingLikes.map((item) => (
                  <View
                    key={item.requestId}
                    className="rounded-xl p-3.5 mb-2 border"
                    style={
                      isDeadlineSoon(item.createdAt, item.status)
                        ? { backgroundColor: "#fef2f2", borderColor: "#fecaca" }
                        : { backgroundColor: "#f8fbff", borderColor: "#dbeafe" }
                    }
                  >
                    <Text className="text-lg font-bold text-gray-900 mb-1">
                      {item.displayName || "Unknown"}{item.age ? `, ${item.age}` : ""}
                    </Text>
                    <Text className="text-sm text-gray-500 mb-1.5">
                      {item.rank ? `Rank ${item.rank}` : "Rank 不明"}
                    </Text>
                    <Text className="text-sm font-semibold text-gray-700 mb-1.5">
                      {item.status === "pending" ? "依頼中（承諾待ち）" : "期限切れ（再依頼できます）"}
                    </Text>
                    <Text
                      className="text-xs font-bold mb-1.5"
                      style={{
                        color: isDeadlineSoon(item.createdAt, item.status)
                          ? "#dc2626"
                          : item.status === "expired"
                            ? "#7c2d12"
                            : "#2563eb",
                      }}
                    >
                      期限: {getRemainingDaysLabel(item.createdAt, item.status)}
                    </Text>
                    <Text className="text-xs text-gray-400 mb-2.5">{formatDateTime(item.createdAt)}</Text>
                    <ActionButtonRow>
                      <ActionButton
                        label="プロフィールを見る"
                        variant="secondary"
                        style={{ backgroundColor: "#6b7280", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}
                        textStyle={{ color: "#fff", fontWeight: "700", fontSize: 13 }}
                        onPress={() => router.push(`/user/${item.targetUserId}`)}
                      />
                      {item.status === "expired" ? (
                        <ActionButton
                          label="もう一度いいねを送る"
                          style={{ backgroundColor: "#2563eb", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}
                          textStyle={{ color: "#fff", fontWeight: "700", fontSize: 13 }}
                          onPress={() => handleRelike(item.targetUserId)}
                        />
                      ) : null}
                    </ActionButtonRow>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        }
        renderItem={({ item }) => (
          <View className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-2.5">
            <Text className="text-lg font-bold text-gray-900 mb-1">
              {item.displayName || "Unknown"}{item.age ? `, ${item.age}` : ""}
            </Text>
            <Text className="text-sm text-gray-500 mb-1.5">
              {item.location || "場所未設定"}{item.rank ? ` / Rank ${item.rank}` : ""}
            </Text>
            <Text className="text-sm text-gray-600 mb-2">{item.bio || "自己紹介はありません"}</Text>
            <Text className="text-sm text-gray-600 mb-1">{item.lastMessage || "まだメッセージはありません"}</Text>
            <Text className="text-xs text-gray-400 mb-2.5">{formatDateTime(item.lastMessageAt || item.matchedAt)}</Text>
            <View className="flex-row items-center justify-between">
              <ActionButton
                label="チャットを開く"
                style={{ alignSelf: "flex-start", backgroundColor: "#e74c3c", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}
                textStyle={{ color: "#fff", fontWeight: "600", fontSize: 13 }}
                onPress={() => router.push(`/chat/${item.id}`)}
              />
              {(item.unreadCount || 0) > 0 && (
                <View className="min-w-6 h-6 px-2 rounded-full bg-red-500 items-center justify-center">
                  <Text className="text-white text-xs font-bold">{item.unreadCount}</Text>
                </View>
              )}
            </View>
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e74c3c" />}
        ListEmptyComponent={
          <EmptyState
            message={
              incomingLikes.length > 0 || outgoingLikes.length > 0
                ? "マッチはまだありません"
                : "受信・送信したいいねはまだありません"
            }
            textStyle={{ textAlign: "center", marginTop: 30, color: "#999", fontSize: 15 }}
          />
        }
      />
    </View>
  );
}
""",
)

print("TimelineScreen and MatchesScreen done!")
