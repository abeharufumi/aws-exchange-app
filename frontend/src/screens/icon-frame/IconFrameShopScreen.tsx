import React, { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { EmptyState } from "../../components/common/EmptyState";
import { LoadingState } from "../../components/common/LoadingState";
import { ScreenBackHeader } from "../../components/common/ScreenBackButton";
import { SegmentedTab } from "../../components/common/SegmentedTab";
import apiClient from "../../services/api";
import {
  IconFrameEquipResponse,
  IconFrameItem,
  IconFramePurchaseResponse,
} from "../../types/icon-frame";

const RARITY_ICON: Record<string, string> = {
  common: "🔘",
  rare: "🔵",
  epic: "🟣",
  legendary: "🌟",
};

const RARITY_LABEL: Record<string, string> = {
  common: "コモン",
  rare: "レア",
  epic: "エピック",
  legendary: "レジェンダリー",
};

const ICON_FRAME_TABS = [
  { key: "all", label: "すべて" },
  { key: "owned", label: "所有済み" },
] as const;

export function IconFrameShopScreen() {
  const router = useRouter();
  const [frames, setFrames] = useState<IconFrameItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "owned">("all");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [confirmFrame, setConfirmFrame] = useState<IconFrameItem | null>(null);

  const fetchFrames = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = tab === "owned" ? "/icon-frames/my-frames" : "/icon-frames";
      const response = await apiClient.get<IconFrameItem[]>(endpoint);
      setFrames(response.data || []);
    } catch (error) {
      console.error("Failed to fetch icon frames:", error);
      setFrames([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchFrames();
  }, [fetchFrames]);

  const handlePurchaseConfirm = async () => {
    if (!confirmFrame || processingId !== null) return;
    const frame = confirmFrame;
    setConfirmFrame(null);
    try {
      setProcessingId(frame.id);
      const response = await apiClient.post<IconFramePurchaseResponse>(
        `/icon-frames/purchase/${frame.id}`,
      );
      if (response.data?.status === "already_owned") {
        Alert.alert("所有済み", "このフレームはすでに所有しています");
      }
      fetchFrames();
    } catch (error) {
      console.error("Failed to purchase frame:", error);
      Alert.alert("エラー", "フレームの購入に失敗しました");
    } finally {
      setProcessingId(null);
    }
  };

  const handleEquip = async (frame: IconFrameItem) => {
    if (processingId !== null) return;
    try {
      setProcessingId(frame.id);
      await apiClient.post<IconFrameEquipResponse>(`/icon-frames/equip/${frame.id}`);
      Alert.alert("装備完了", `「${frame.name}」を装備しました！`);
      fetchFrames();
    } catch (error) {
      console.error("Failed to equip frame:", error);
      Alert.alert("エラー", "フレームの装備に失敗しました");
    } finally {
      setProcessingId(null);
    }
  };

  const getRarityStyle = (rarity: string) => {
    switch (rarity) {
      case "rare":
        return { backgroundColor: "#dbeafe" };
      case "epic":
        return { backgroundColor: "#ede9fe" };
      case "legendary":
        return { backgroundColor: "#fef9c3" };
      default:
        return { backgroundColor: "#e5e7eb" };
    }
  };

  const getRarityTextStyle = (rarity: string) => {
    switch (rarity) {
      case "rare":
        return { color: "#2563eb" };
      case "epic":
        return { color: "#7c3aed" };
      case "legendary":
        return { color: "#d97706" };
      default:
        return { color: "#6b7280" };
    }
  };

  const renderItem = ({ item }: { item: IconFrameItem }) => {
    const isProcessing = processingId === item.id;

    return (
      <View
        style={[
          {
            marginBottom: 12,
            borderRadius: 12,
            borderWidth: 1,
            backgroundColor: "#ffffff",
            padding: 16,
          },
          {
            borderColor: item.is_equipped ? "#e74c3c" : "#e5e7eb",
            borderWidth: item.is_equipped ? 2 : 1,
          },
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              height: 72,
              width: 72,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 9999,
              backgroundColor: "#f3f4f6",
            }}
          >
            <Text style={{ fontSize: 36 }}>{RARITY_ICON[item.rarity] || "🔘"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ marginBottom: 4, fontSize: 16, fontWeight: "700", color: "#1f2937" }}>
              {item.name}
            </Text>
            {item.description ? (
              <Text style={{ marginBottom: 6, fontSize: 12, color: "#6b7280" }}>
                {item.description}
              </Text>
            ) : null}
            <View
              style={[
                {
                  marginBottom: 6,
                  alignSelf: "flex-start",
                  borderRadius: 9999,
                  paddingHorizontal: 8,
                },
                getRarityStyle(item.rarity),
              ]}
            >
              <Text
                style={[
                  { fontWeight: "700", textTransform: "uppercase" },
                  getRarityTextStyle(item.rarity),
                ]}
              >
                {RARITY_LABEL[item.rarity] || item.rarity}
              </Text>
            </View>
            {item.is_free ? (
              <Text style={{ fontWeight: "700" }}>無料</Text>
            ) : (
              <Text style={{ fontWeight: "700", color: "#ef4444" }}>
                ¥{item.price_jpy.toLocaleString()}
              </Text>
            )}
          </View>
        </View>

        <View style={{ marginTop: 12, flexDirection: "row", gap: 8 }}>
          {item.is_equipped ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                borderRadius: 8,
                backgroundColor: "#f3f4f6",
                paddingVertical: 10,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#9ca3af" }}>✓ 装備中</Text>
            </View>
          ) : item.is_owned ? (
            <TouchableOpacity
              style={{
                flex: 1,
                alignItems: "center",
                borderRadius: 8,
                backgroundColor: "#1f2937",
                paddingVertical: 10,
              }}
              disabled={isProcessing}
              onPress={() => handleEquip(item)}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#ffffff" }}>
                {isProcessing ? "処理中..." : "装備する"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={{
                flex: 1,
                alignItems: "center",
                borderRadius: 8,
                backgroundColor: "#ef4444",
                paddingVertical: 10,
              }}
              disabled={isProcessing}
              onPress={() => setConfirmFrame(item)}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#ffffff" }}>
                {isProcessing ? "処理中..." : `¥${item.price_jpy.toLocaleString()} で購入`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <Modal
        visible={confirmFrame !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmFrame(null)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(17, 24, 39, 0.24)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setConfirmFrame(null)}
        >
          <Pressable
            style={{ backgroundColor: "#ffffff", borderRadius: 12, padding: 24, width: 300 }}
            onPress={() => {}}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#1f2937", marginBottom: 8 }}>
              フレームを購入しますか？
            </Text>
            <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
              {confirmFrame?.name}
            </Text>
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#ef4444", marginBottom: 20 }}>
              ¥{confirmFrame?.price_jpy.toLocaleString()}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: "#ef4444",
                borderRadius: 8,
                paddingVertical: 12,
                alignItems: "center",
              }}
              onPress={handlePurchaseConfirm}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#ffffff" }}>購入する</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
      <ScreenBackHeader
        title="🖼️ アイコンフレームショップ"
        subtitle="プロフィールアイコンに装飾フレームを付けよう"
        onPress={() => router.back()}
        style={{ borderColor: "#e5e7eb", paddingHorizontal: 20 }}
      />

      <SegmentedTab items={ICON_FRAME_TABS} value={tab} onChange={setTab} />

      {loading ? (
        <LoadingState
          color="#e74c3c"
          containerStyle={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 80,
          }}
        />
      ) : (
        <FlatList
          data={frames}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12 }}
          onRefresh={fetchFrames}
          refreshing={loading}
          ListEmptyComponent={
            <EmptyState
              message={
                tab === "owned"
                  ? "所有済みのフレームはありません"
                  : "利用可能なフレームはまだありません"
              }
              textStyle={{ textAlign: "center", color: "#9ca3af", fontSize: 14, paddingTop: 40 }}
            />
          }
        />
      )}
    </View>
  );
}
