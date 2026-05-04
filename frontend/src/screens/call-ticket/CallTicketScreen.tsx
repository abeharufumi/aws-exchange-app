import React, { useCallback, useEffect, useState } from "react";
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
  const [myProfile, setMyProfile] = useState<Pick<
    UserProfile,
    "gender" | "rank" | "rankProgress"
  > | null>(null);
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
          ? {
              gender: profileResponse.data.gender,
              rank: Number(profileResponse.data.rank || 1),
              rankProgress: profileResponse.data.rankProgress,
            }
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
              await apiClient.post<CallTicketPurchaseResponse>(
                `/call-tickets/purchase/${ticket.id}`,
              );
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
      await apiClient.post("/call-tickets", {
        ticket_duration_minutes: durationNum,
        price_jpy: priceNum,
      });
      Alert.alert("作成完了", "通話チケットを作成しました");
      setDuration("30");
      setPrice("500");
      await fetchData();
      setTab("available");
    } catch (error: any) {
      const rawDetail = error?.response?.data?.detail;
      const detailObj: CallTicketCreateErrorDetail | null =
        rawDetail && typeof rawDetail === "object" ? rawDetail : null;
      const baseMessage =
        (typeof rawDetail === "string" ? rawDetail : detailObj?.message) ||
        "チケット作成に失敗しました";
      const progressText = formatRankProgressLabel(detailObj?.rankProgress);
      if (error?.response?.status === 403 && detailObj?.requiredRank === 5) {
        Alert.alert(
          "ランク条件未達",
          progressText ? `${baseMessage}\n\n次ランク条件: ${progressText}` : baseMessage,
          [
            { text: "閉じる", style: "cancel" },
            {
              text: "次ランク条件を見る",
              onPress: () => router.push("/(tabs)/profile?focus=rank"),
            },
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
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <View
        style={{
          borderBottomWidth: 1,
          borderColor: "#f3f4f6",
          paddingHorizontal: 16,
          paddingTop: 20,
          paddingBottom: 12,
        }}
      >
        <ScreenBackButton onPress={() => router.back()} style={{ paddingRight: 12 }} />
        <Text style={{ marginBottom: 4, fontSize: 24, fontWeight: "700", color: "#111827" }}>
          📞 通話チケット
        </Text>
        <Text style={{ fontSize: 14, color: "#6b7280" }}>チケットの購入・使用・販売ができます</Text>
      </View>

      <SegmentedTab items={CALL_TICKET_TABS} value={tab} onChange={setTab} />

      {loading && tab !== "sell" ? (
        <LoadingState
          color="#2563eb"
          containerStyle={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        />
      ) : tab === "available" ? (
        <FlatList
          data={availableTickets}
          keyExtractor={(item) => `${item.id}`}
          onRefresh={fetchData}
          refreshing={loading}
          renderItem={({ item }) => (
            <SectionCard
              style={{
                marginHorizontal: 16,
                marginVertical: 6,
                borderRadius: 12,
                padding: 14,
                backgroundColor: "#f0f9ff",
                borderWidth: 1,
                borderColor: "#bae6fd",
              }}
            >
              <View
                style={{
                  marginBottom: 6,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ fontSize: 20, fontWeight: "700" }}>
                  {item.ticket_duration_minutes}分
                </Text>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#2563eb" }}>
                  ¥{item.price_jpy.toLocaleString()}
                </Text>
              </View>
              <Text style={{ marginBottom: 12, fontSize: 14, color: "#6b7280" }}>
                販売者: {item.seller_name}
              </Text>
              <ActionButton
                label="購入する"
                style={{
                  backgroundColor: "#2563eb",
                  borderRadius: 8,
                  paddingVertical: 10,
                  alignItems: "center",
                }}
                textStyle={{ color: "#fff", fontSize: 14, fontWeight: "700" }}
                onPress={() => handlePurchase(item)}
              />
            </SectionCard>
          )}
          ListEmptyComponent={
            <EmptyState
              message="購入可能なチケットはありません"
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
      ) : tab === "purchased" ? (
        <FlatList
          data={purchasedTickets}
          keyExtractor={(item) => `${item.purchase_id}`}
          onRefresh={fetchData}
          refreshing={loading}
          renderItem={({ item }) => (
            <SectionCard
              style={{
                marginHorizontal: 16,
                marginVertical: 6,
                borderRadius: 12,
                padding: 14,
                backgroundColor: "#f9fafb",
                borderWidth: 1,
                borderColor: "#e5e7eb",
              }}
            >
              <Text style={{ marginBottom: 4, fontSize: 16, fontWeight: "600", color: "#1f2937" }}>
                {item.seller_name}
              </Text>
              <Text style={{ marginBottom: 2, fontSize: 14, color: "#6b7280" }}>
                {item.ticket_duration_minutes}分 / ¥{item.amount_jpy.toLocaleString()}
              </Text>
              <Text style={{ marginBottom: 12, fontSize: 14, color: "#6b7280" }}>
                購入日: {new Date(item.purchased_at).toLocaleDateString("ja-JP")}
              </Text>
              {item.is_used ? (
                <View
                  style={{
                    alignSelf: "flex-start",
                    borderRadius: 9999,
                    backgroundColor: "#e5e7eb",
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#6b7280" }}>
                    使用済み
                  </Text>
                </View>
              ) : (
                <ActionButton
                  label="使用済みにする"
                  style={{
                    backgroundColor: "#7c3aed",
                    borderRadius: 8,
                    paddingVertical: 10,
                    alignItems: "center",
                  }}
                  textStyle={{ color: "#fff", fontSize: 14, fontWeight: "700" }}
                  onPress={() => handleUse(item.purchase_id)}
                />
              )}
            </SectionCard>
          )}
          ListEmptyComponent={
            <EmptyState
              message="購入済みチケットはありません"
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
      ) : (
        <SectionCard
          style={{
            margin: 16,
            borderRadius: 12,
            padding: 16,
            backgroundColor: "#f9fafb",
            borderWidth: 1,
            borderColor: "#e5e7eb",
          }}
        >
          <Text style={{ marginBottom: 16, fontSize: 16, fontWeight: "700", color: "#111827" }}>
            通話チケットを販売する
          </Text>
          {canSell ? (
            <>
              <Text style={{ marginBottom: 6, fontSize: 12, fontWeight: "600", color: "#6b7280" }}>
                通話時間（分）
              </Text>
              <TextInput
                style={inputStyle}
                value={duration}
                onChangeText={setDuration}
                keyboardType="number-pad"
                placeholder="例: 30"
                placeholderTextColor="#9ca3af"
              />
              <Text style={{ marginBottom: 6, fontSize: 12, fontWeight: "600", color: "#6b7280" }}>
                価格（円）
              </Text>
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
                  {
                    backgroundColor: "#2563eb",
                    borderRadius: 8,
                    paddingVertical: 12,
                    alignItems: "center",
                  },
                  creating ? { opacity: 0.5 } : undefined,
                ]}
                textStyle={{ color: "#fff", fontSize: 15, fontWeight: "700" }}
                disabled={creating}
                onPress={handleCreate}
              />
            </>
          ) : (
            <>
              <Text style={{ marginBottom: 12, fontSize: 14, color: "#6b7280" }}>
                {canSellByGender
                  ? `現在ランク: Rank ${currentRank}（Rank5で販売解放）`
                  : "男性ユーザーのみ販売できます"}
              </Text>
              {canSellByGender && myProfile?.rankProgress && !myProfile.rankProgress.isMaxRank
                ? myProfile.rankProgress.items.map((item) => {
                    const unit = item.unit || "";
                    return (
                      <Text
                        key={item.key}
                        style={{ marginBottom: 4, fontSize: 12, color: "#9ca3af" }}
                      >
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
                  style={{
                    marginTop: 8,
                    alignSelf: "flex-start",
                    borderRadius: 8,
                    backgroundColor: "#f3f4f6",
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                  }}
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
