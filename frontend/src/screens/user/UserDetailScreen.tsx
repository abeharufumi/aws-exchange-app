import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ActionButton } from "../../components/common/ActionButton";
import { ActionButtonRow } from "../../components/common/ActionButtonRow";
import { AvatarWithFrame } from "../../components/common/AvatarWithFrame";
import { UserPresenceStatus } from "../../components/common";
import { EmptyState } from "../../components/common/EmptyState";
import { LoadingState } from "../../components/common/LoadingState";
import { ScreenBackButton } from "../../components/common/ScreenBackButton";
import apiClient from "../../services/api";
import { PublicUserProfile } from "../../types/user";
import { LikeActionResponse, PassActionResponse } from "../../types/match";
import { RankProgress } from "../../types/profile";
import { CallTicketItem, CallTicketPurchaseResponse } from "../../types/call-ticket";

type LikeBlockedDetail = {
  message?: string;
  senderRank?: number;
  requiredRank?: number;
  rankProgress?: RankProgress;
};

type CallTicketPurchaseErrorDetail = {
  message?: string;
};
export function UserDetailScreen({ route }: any) {
  const router = useRouter();
  const { id } = route.params;
  const userId = Number(id);
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [sellerTickets, setSellerTickets] = useState<CallTicketItem[]>([]);
  const [ticketLoading, setTicketLoading] = useState(false);

  const handleLike = async () => {
    if (!profile) return;
    setActionLoading(true);
    try {
      const res = await apiClient.post<LikeActionResponse>("/matches/like", {
        target_user_id: profile.id,
      });
      const { status, message } = res.data;
      if (status === "matched") {
        Alert.alert("マッチ成立！", message || "お互いにいいねしました！");
      } else if (status === "already_pending") {
        Alert.alert("依頼中", message);
      } else if (status === "already_matched") {
        Alert.alert("マッチ済み", message);
      } else if (status === "blocked_by_filter") {
        const d = res.data as LikeBlockedDetail;
        Alert.alert(
          "送信不可",
          `${d.message || message}${d.requiredRank ? `\n必要ランク: Rank${d.requiredRank}` : ""}`,
        );
      } else {
        Alert.alert("完了", message || "いいねを送信しました");
      }
    } catch (error: any) {
      Alert.alert("エラー", error?.response?.data?.detail || "いいね送信に失敗しました");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePass = async () => {
    if (!profile) return;
    setActionLoading(true);
    try {
      const res = await apiClient.post<PassActionResponse>("/matches/pass", {
        target_user_id: profile.id,
      });
      Alert.alert("見送り", res.data?.message || "見送りを登録しました");
      router.back();
    } catch (error: any) {
      Alert.alert("エラー", error?.response?.data?.detail || "パス送信に失敗しました");
    } finally {
      setActionLoading(false);
    }
  };

  const fetchProfile = useCallback(async () => {
    try {
      if (!Number.isFinite(userId)) {
        setProfile(null);
        return;
      }
      const response = await apiClient.get<PublicUserProfile>(`/users/${userId}`);
      setProfile(response.data);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const fetchSellerTickets = useCallback(async () => {
    if (!Number.isFinite(userId)) return;
    setTicketLoading(true);
    try {
      const res = await apiClient.get<CallTicketItem[]>(`/call-tickets/seller/${userId}`);
      setSellerTickets(res.data);
    } catch {
      setSellerTickets([]);
    } finally {
      setTicketLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSellerTickets();
  }, [fetchSellerTickets]);

  const executePurchaseTicket = async (ticketId: number, durationMin: number) => {
    try {
      await apiClient.post<CallTicketPurchaseResponse>(`/call-tickets/purchase/${ticketId}`);
      Alert.alert("購入完了", `通話チケット（${durationMin}分）を購入しました`);
      fetchSellerTickets();
    } catch (error: any) {
      const d = error?.response?.data as CallTicketPurchaseErrorDetail;
      Alert.alert("購入失敗", d?.message || error?.response?.data?.detail || "購入に失敗しました");
    }
  };

  const handlePurchaseTicket = async (ticketId: number, durationMin: number, priceJpy: number) => {
    if (Platform.OS === "web") {
      const confirmed =
        typeof window !== "undefined"
          ? window.confirm(`${durationMin}分 / ¥${priceJpy.toLocaleString()} を購入しますか？`)
          : true;
      if (!confirmed) {
        return;
      }
      await executePurchaseTicket(ticketId, durationMin);
      return;
    }

    Alert.alert(
      "通話チケット購入",
      `${durationMin}分 / ¥${priceJpy.toLocaleString()} を購入しますか？`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "購入する",
          onPress: async () => {
            await executePurchaseTicket(ticketId, durationMin);
          },
        },
      ],
    );
  };
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)/matches");
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
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          borderBottomWidth: 1,
          borderColor: "#e5e7eb",
          paddingHorizontal: 12,
        }}
      >
        <ScreenBackButton
          compact
          label="<"
          onPress={handleBack}
          style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}
          textStyle={{ fontSize: 24, fontWeight: "700", color: "#111827", lineHeight: 24 }}
        />
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827" }}>プロフィール</Text>
      </View>

      {!profile ? (
        <EmptyState
          message="プロフィールが見つかりません"
          containerStyle={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          textStyle={{ textAlign: "center", color: "#6b7280", fontSize: 15 }}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#fecaca",
              backgroundColor: "#fef2f2",
              padding: 20,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 12 }}>
              <AvatarWithFrame
                avatarUrl={profile.avatarUrl}
                iconFrameRarity={profile.iconFrameRarity}
                iconFrameName={profile.iconFrameName}
                size={80}
                initials={profile.displayName?.[0]}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{ marginBottom: 4, fontSize: 24, fontWeight: "700", color: "#111827" }}
                >
                  {profile.displayName}
                  {profile.age ? `, ${profile.age}` : ""}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151" }}>
                  {profile.location || "場所未設定"} / Rank {profile.rank || 1}
                </Text>
                <View style={{ marginTop: 6 }}>
                  <UserPresenceStatus
                    status={profile.onlineStatus}
                    lastActiveAt={profile.lastActiveAt}
                    textColor="#4b5563"
                  />
                </View>
              </View>
            </View>
            <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: "600", color: "#374151" }}>
              ⭐ {Number(profile.reviewAvg || 0).toFixed(2)} / 🤝 {profile.meetsCount || 0}回
            </Text>
            <Text style={{ marginBottom: 8, fontSize: 13, color: "#6b7280" }}>
              🎁 ギフト送信用ID: {profile.id}
            </Text>

            <Text style={{ marginBottom: 6, fontSize: 14, fontWeight: "700", color: "#111827" }}>
              自己紹介
            </Text>
            <Text style={{ fontSize: 14, color: "#4b5563" }}>
              {profile.bio || "自己紹介はありません"}
            </Text>

            <ActionButtonRow style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
              <ActionButton
                label="❤️ いいね"
                variant="danger"
                onPress={handleLike}
                disabled={actionLoading}
                style={{
                  flex: 1,
                  backgroundColor: "#e74c3c",
                  borderRadius: 10,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
                textStyle={{ color: "#fff", fontSize: 14, fontWeight: "700" }}
              />
              <ActionButton
                label="パス"
                variant="secondary"
                onPress={handlePass}
                disabled={actionLoading}
                style={{
                  flex: 1,
                  backgroundColor: "#6b7280",
                  borderRadius: 10,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
                textStyle={{ color: "#fff", fontSize: 14, fontWeight: "700" }}
              />
            </ActionButtonRow>

            <ActionButtonRow style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
              <ActionButton
                label="チャットを開く"
                variant="secondary"
                onPress={() => router.push(`/chat/${profile.id}`)}
                style={{
                  flex: 1,
                  backgroundColor: "#2563eb",
                  borderRadius: 10,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
                textStyle={{ color: "#fff", fontSize: 14, fontWeight: "700" }}
              />
              <ActionButton
                label="戻る"
                onPress={handleBack}
                style={{
                  flex: 1,
                  backgroundColor: "#e74c3c",
                  borderRadius: 10,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
                textStyle={{ color: "#fff", fontSize: 14, fontWeight: "700" }}
              />
            </ActionButtonRow>

            <ActionButtonRow style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
              <ActionButton
                label="ファンクラブ"
                variant="secondary"
                onPress={() => router.push(`/fanclub/${profile.id}`)}
                style={{
                  flex: 1,
                  backgroundColor: "#2563eb",
                  borderRadius: 10,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
                textStyle={{ color: "#fff", fontSize: 14, fontWeight: "700" }}
              />
              <ActionButton
                label="ギフトを送る"
                onPress={() => router.push(`/gifts?recipientId=${profile.id}`)}
                style={{
                  flex: 1,
                  backgroundColor: "#e74c3c",
                  borderRadius: 10,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
                textStyle={{ color: "#fff", fontSize: 14, fontWeight: "700" }}
              />
            </ActionButtonRow>

            {/* 通話チケット */}
            <View style={{ marginTop: 20 }}>
              <Text style={{ marginBottom: 6, fontSize: 14, fontWeight: "700", color: "#111827" }}>
                通話チケット
              </Text>
              {ticketLoading ? (
                <ActivityIndicator size="small" color="#e74c3c" style={{ marginTop: 12 }} />
              ) : sellerTickets.length > 0 ? (
                sellerTickets.map((ticket) => (
                  <View key={ticket.id} style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: "#111827" }}>
                        チケットNo. #{ticket.id}
                      </Text>
                      <Text style={{ color: "#333" }}>
                        {ticket.ticket_duration_minutes}分 / ¥{ticket.price_jpy.toLocaleString()}
                      </Text>
                    </View>
                    <ActionButton
                      label="購入"
                      onPress={() =>
                        handlePurchaseTicket(
                          ticket.id,
                          ticket.ticket_duration_minutes,
                          ticket.price_jpy,
                        )
                      }
                      style={{
                        flex: 1,
                        backgroundColor: "#e74c3c",
                        borderRadius: 10,
                        paddingVertical: 12,
                        alignItems: "center",
                      }}
                      textStyle={{ color: "#fff", fontSize: 14, fontWeight: "700" }}
                    />
                  </View>
                ))
              ) : (
                <Text style={{ fontSize: 13, color: "#6b7280" }}>
                  販売中の通話チケットはありません
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
