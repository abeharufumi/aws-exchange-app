import React, { useCallback, useEffect, useState } from "react";
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
  const { recipientId: initialRecipientId, tab: initialTab } = useLocalSearchParams<{
    recipientId?: string;
    tab?: string;
  }>();
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
    if (!initialTab || initialRecipientId) {
      return;
    }
    if (initialTab === "received" || initialTab === "sent" || initialTab === "send") {
      setTab(initialTab);
    }
  }, [initialTab, initialRecipientId]);

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
          🎁 ギフト
        </Text>
        <Text style={{ fontSize: 14, color: "#6b7280" }}>ギフト送信・受信履歴を管理できます</Text>
      </View>

      <SegmentedTab items={GIFT_TABS} value={tab} onChange={setTab} />

      {loading ? (
        <LoadingState
          color="#ec4899"
          containerStyle={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        />
      ) : tab === "send" ? (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={{ marginBottom: 6, fontSize: 12, fontWeight: "600", color: "#6b7280" }}>
            受取ユーザーID
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 8,
              paddingHorizontal: 14,
              paddingVertical: 10,
              fontSize: 15,
              color: "#111827",
              backgroundColor: "#f9fafb",
              marginBottom: 16,
            }}
            value={recipientId}
            onChangeText={setRecipientId}
            keyboardType="number-pad"
            placeholder="例: 5"
            placeholderTextColor="#9ca3af"
          />
          <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: "600", color: "#374151" }}>
            ギフトを選択
          </Text>
          <View style={{ marginBottom: 16, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {items.map((item) => {
              const parsed = renderGiftLabel(item.name);
              const isSelected = selectedGiftId === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={{
                    alignItems: "center",
                    borderRadius: 12,
                    borderWidth: 1,
                    padding: 12,
                    width: "30%",
                    backgroundColor: isSelected ? "#fdf2f8" : "#f9fafb",
                    borderColor: isSelected ? "#ec4899" : "#e5e7eb",
                  }}
                  onPress={() => setSelectedGiftId(item.id)}
                >
                  <Text style={{ fontSize: 28 }}>{parsed.emoji}</Text>
                  <Text
                    style={{
                      marginTop: 4,
                      textAlign: "center",
                      fontSize: 12,
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    {parsed.label}
                  </Text>
                  <Text
                    style={{
                      marginTop: 2,
                      fontSize: 12,
                      fontWeight: "700",
                      color: isSelected ? "#db2777" : "#6b7280",
                    }}
                  >
                    ¥{item.price_jpy.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {sendRestriction && (
            <SectionCard
              style={{
                borderRadius: 12,
                padding: 14,
                marginBottom: 12,
                backgroundColor: "#fff1f2",
                borderWidth: 1,
                borderColor: "#fecdd3",
              }}
            >
              <Text style={{ marginBottom: 4, fontSize: 14, fontWeight: "700", color: "#dc2626" }}>
                送信できません
              </Text>
              <Text style={{ marginBottom: 4, fontSize: 14, color: "#374151" }}>
                {sendRestriction.message}
              </Text>
              {sendRestriction.requiredRank && sendRestriction.currentRank ? (
                <Text style={{ marginBottom: 4, fontSize: 12, color: "#6b7280" }}>
                  相手ランク: Rank{sendRestriction.currentRank} / 必要: Rank
                  {sendRestriction.requiredRank}
                </Text>
              ) : null}
              {sendRestriction.requiredGender ? (
                <Text style={{ marginBottom: 4, fontSize: 12, color: "#6b7280" }}>
                  対象性別: {sendRestriction.requiredGender === "female" ? "女性" : "指定あり"}
                  {sendRestriction.recipientGender
                    ? ` / 相手: ${sendRestriction.recipientGender === "female" ? "女性" : sendRestriction.recipientGender === "male" ? "男性" : sendRestriction.recipientGender}`
                    : ""}
                </Text>
              ) : null}
              {formatRankProgressLabel(sendRestriction.rankProgress) ? (
                <Text style={{ marginBottom: 8, fontSize: 12, color: "#6b7280" }}>
                  次ランク目安: {formatRankProgressLabel(sendRestriction.rankProgress)}
                </Text>
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
                  style={{
                    alignSelf: "flex-start",
                    borderRadius: 8,
                    backgroundColor: "#f3f4f6",
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                  }}
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
              {
                backgroundColor: "#ec4899",
                borderRadius: 8,
                paddingVertical: 12,
                alignItems: "center",
              },
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
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center" }}
                  onPress={() => {
                    if (!item.is_opened) {
                      handleOpenGift(item.id);
                    }
                  }}
                >
                  <Text style={{ fontSize: 36, marginRight: 12 }}>{parsed.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: "#1f2937" }}>
                      {parsed.label}
                    </Text>
                    <Text style={{ fontSize: 14, color: "#6b7280" }}>from {item.sender_name}</Text>
                    <Text style={{ fontSize: 14, fontWeight: "600" /* text-pink-600 */ }}>
                      ¥{item.price_jpy.toLocaleString()}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#9ca3af" }}>
                      {new Date(item.sent_at).toLocaleString("ja-JP")}
                    </Text>
                  </View>
                  {!item.is_opened && (
                    <View
                      style={{
                        borderRadius: 9999,
                        backgroundColor: "#ec4899",
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: "700", color: "#ffffff" }}>
                        未開封
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </SectionCard>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              message="受け取ったギフトはありません"
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
        <FlatList
          data={sent}
          keyExtractor={(item) => item.id.toString()}
          onRefresh={fetchData}
          refreshing={loading}
          renderItem={({ item }) => {
            const parsed = renderGiftLabel(item.gift_name);
            return (
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
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ fontSize: 36, marginRight: 12 }}>{parsed.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: "#1f2937" }}>
                      {parsed.label}
                    </Text>
                    <Text style={{ fontSize: 14, color: "#6b7280" }}>to {item.recipient_name}</Text>
                    <Text style={{ fontSize: 14, fontWeight: "600" /* text-pink-600 */ }}>
                      ¥{item.price_jpy.toLocaleString()}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#9ca3af" }}>
                      {new Date(item.sent_at).toLocaleString("ja-JP")}
                    </Text>
                  </View>
                  <View
                    style={{
                      borderRadius: 9999,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      backgroundColor: item.is_opened ? "#e5e7eb" : "#ec4899",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: item.is_opened ? "#6b7280" : "#ffffff",
                      }}
                    >
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
      )}
    </View>
  );
}
