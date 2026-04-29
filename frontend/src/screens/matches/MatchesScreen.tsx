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

  useEffect(() => {
    fetchMatches();
  }, []);

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
      setMatches([]);
      setIncomingLikes([]);
      setOutgoingLikes([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchMatches();
    } finally {
      setRefreshing(false);
    }
  };

  const formatDateTime = (raw?: string) => {
    if (!raw) return "";
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("ja-JP", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
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
      const response = await apiClient.post<LikeActionResponse>("/matches/like", {
        target_user_id: targetUserId,
      });
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
            ? `${message}\n\n次ランク条件: ${progressText}`
            : `${message}${detail.requiredRank && detail.senderRank ? `\n現在ランク: Rank${detail.senderRank} / 必要ランク: Rank${detail.requiredRank}` : ""}`,
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
      const response = await apiClient.post<IncomingLikeAcceptResponse>(
        `/matches/requests/${requestId}/accept`,
      );
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
    } finally {
      setProcessingLikeBackUserId(null);
    }
  };

  const handlePassIncoming = async (requestId: number, sourceUserId: number) => {
    if (isIncomingActionBusy) return;
    try {
      setProcessingPassUserId(sourceUserId);
      const response = await apiClient.post<IncomingLikeRejectResponse>(
        `/matches/requests/${requestId}/reject`,
      );
      if (response.data?.status === "already_processed") {
        Alert.alert("処理済み", response.data?.message || "この依頼は既に処理されています");
      } else {
        Alert.alert("完了", response.data?.message || "見送りました");
      }
      await fetchMatches();
    } catch (error) {
      console.error("Failed to pass incoming like:", error);
      Alert.alert("エラー", "見送りに失敗しました");
    } finally {
      setProcessingPassUserId(null);
    }
  };

  if (loading) return <LoadingState color="#e74c3c" />;

  const btnDisabledStyle = isIncomingActionBusy ? { opacity: 0.55 } : undefined;
  const btnTextDisabledStyle = isIncomingActionBusy ? { color: "#f3f4f6" } : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff", padding: 16 }}>
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <>
            {incomingLikes.length > 0 ? (
              <View style={{ marginBottom: 12 }}>
                <Text
                  style={{ fontSize: 16, fontWeight: "700", color: "#1f2937", marginBottom: 8 }}
                >
                  受信したいいね
                </Text>
                {incomingLikes.map((item) => (
                  <View
                    key={item.requestId}
                    style={[
                      { borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1 },
                      isDeadlineSoon(item.createdAt, "pending")
                        ? { backgroundColor: "#fff7ed", borderColor: "#fdba74" }
                        : { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
                    ]}
                  >
                    <Text
                      style={{ fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 4 }}
                    >
                      {item.displayName || "Unknown"}
                      {item.age ? `, ${item.age}` : ""}
                    </Text>
                    <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 6 }}>
                      {item.location || "場所未設定"}
                      {item.rank ? ` / Rank ${item.rank}` : ""}
                    </Text>
                    <Text
                      style={{ fontSize: 12, color: "#6b7280", fontWeight: "600", marginBottom: 6 }}
                    >
                      {getLastLoginLabel(item.lastLoginAt)}
                    </Text>
                    <Text style={{ fontSize: 14, color: "#4b5563", marginBottom: 8 }}>
                      {item.bio || "自己紹介はありません"}
                    </Text>
                    <Text
                      style={[
                        { fontSize: 12, fontWeight: "700", marginBottom: 6 },
                        {
                          color: isDeadlineSoon(item.createdAt, "pending") ? "#dc2626" : "#2563eb",
                        },
                      ]}
                    >
                      期限: {getRemainingDaysLabel(item.createdAt, "pending")}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10 }}>
                      {formatDateTime(item.createdAt)}
                    </Text>
                    <ActionButtonRow>
                      <ActionButton
                        label="プロフィールを見る"
                        variant="secondary"
                        style={[
                          {
                            backgroundColor: "#6b7280",
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                          },
                          btnDisabledStyle,
                        ]}
                        textStyle={[
                          { color: "#fff", fontWeight: "700", fontSize: 13 },
                          btnTextDisabledStyle,
                        ]}
                        onPress={() => router.push(`/user/${item.sourceUserId}`)}
                        disabled={isIncomingActionBusy}
                      />
                      <ActionButton
                        label={
                          processingLikeBackUserId === item.sourceUserId
                            ? "処理中..."
                            : "いいねを返す"
                        }
                        style={[
                          {
                            backgroundColor: "#2563eb",
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                          },
                          btnDisabledStyle,
                        ]}
                        textStyle={[
                          { color: "#fff", fontWeight: "700", fontSize: 13 },
                          btnTextDisabledStyle,
                        ]}
                        onPress={() => handleLikeBack(item.requestId, item.sourceUserId)}
                        disabled={isIncomingActionBusy}
                      />
                      <ActionButton
                        label={processingPassUserId === item.sourceUserId ? "処理中..." : "見送る"}
                        variant="danger"
                        style={[
                          {
                            backgroundColor: "#6b7280",
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                          },
                          btnDisabledStyle,
                        ]}
                        textStyle={[
                          { color: "#fff", fontWeight: "700", fontSize: 13 },
                          btnTextDisabledStyle,
                        ]}
                        onPress={() => handlePassIncoming(item.requestId, item.sourceUserId)}
                        disabled={isIncomingActionBusy}
                      />
                    </ActionButtonRow>
                  </View>
                ))}
              </View>
            ) : null}

            {outgoingLikes.length > 0 ? (
              <View style={{ marginBottom: 12 }}>
                <Text
                  style={{ fontSize: 16, fontWeight: "700", color: "#1f2937", marginBottom: 8 }}
                >
                  送信中のいいね
                </Text>
                {outgoingLikes.map((item) => (
                  <View
                    key={item.requestId}
                    style={[
                      { borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1 },
                      isDeadlineSoon(item.createdAt, item.status)
                        ? { backgroundColor: "#fef2f2", borderColor: "#fecaca" }
                        : { backgroundColor: "#f8fbff", borderColor: "#dbeafe" },
                    ]}
                  >
                    <Text
                      style={{ fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 4 }}
                    >
                      {item.displayName || "Unknown"}
                      {item.age ? `, ${item.age}` : ""}
                    </Text>
                    <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 6 }}>
                      {item.rank ? `Rank ${item.rank}` : "Rank 不明"}
                    </Text>
                    <Text
                      style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6 }}
                    >
                      {item.status === "pending"
                        ? "依頼中（承諾待ち）"
                        : "期限切れ（再依頼できます）"}
                    </Text>
                    <Text
                      style={[
                        { fontSize: 12, fontWeight: "700", marginBottom: 6 },
                        {
                          color: isDeadlineSoon(item.createdAt, item.status)
                            ? "#dc2626"
                            : item.status === "expired"
                              ? "#7c2d12"
                              : "#2563eb",
                        },
                      ]}
                    >
                      期限: {getRemainingDaysLabel(item.createdAt, item.status)}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10 }}>
                      {formatDateTime(item.createdAt)}
                    </Text>
                    <ActionButtonRow>
                      <ActionButton
                        label="プロフィールを見る"
                        variant="secondary"
                        style={{
                          backgroundColor: "#6b7280",
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                        }}
                        textStyle={{ color: "#fff", fontWeight: "700", fontSize: 13 }}
                        onPress={() => router.push(`/user/${item.targetUserId}`)}
                      />
                      {item.status === "expired" ? (
                        <ActionButton
                          label="もう一度いいねを送る"
                          style={{
                            backgroundColor: "#2563eb",
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                          }}
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
          <View
            style={{
              backgroundColor: "#fef2f2",
              borderWidth: 1,
              borderColor: "#fecaca",
              borderRadius: 12,
              padding: 14,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 4 }}>
              {item.displayName || "Unknown"}
              {item.age ? `, ${item.age}` : ""}
            </Text>
            <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 6 }}>
              {item.location || "場所未設定"}
              {item.rank ? ` / Rank ${item.rank}` : ""}
            </Text>
            <Text style={{ fontSize: 14, color: "#4b5563", marginBottom: 8 }}>
              {item.bio || "自己紹介はありません"}
            </Text>
            <Text style={{ fontSize: 14, color: "#4b5563", marginBottom: 4 }}>
              {item.lastMessage || "まだメッセージはありません"}
            </Text>
            <Text style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10 }}>
              {formatDateTime(item.lastMessageAt || item.matchedAt)}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <ActionButton
                label="チャットを開く"
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: "#e74c3c",
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
                textStyle={{ color: "#fff", fontWeight: "600", fontSize: 13 }}
                onPress={() => router.push(`/chat/${item.id}`)}
              />
              {(item.unreadCount || 0) > 0 && (
                <View
                  style={{
                    height: 24,
                    paddingHorizontal: 8,
                    borderRadius: 9999,
                    backgroundColor: "#ef4444",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "700" }}>
                    {item.unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e74c3c" />
        }
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
