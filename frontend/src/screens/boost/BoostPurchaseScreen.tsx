import React, { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenBackHeader } from "@/src/components/common/ScreenBackHeader";
import apiClient from "@/src/services/api";
import { BoostActivationResponse, BoostPurchaseResponse } from "@/src/types/boost";

const BOOST_PRICE_JPY = 500;

export function BoostPurchaseScreen() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);

      // Backend に購入リクエスト
      const response = await apiClient.post<BoostPurchaseResponse>("/boost/purchase", {
        price_jpy: BOOST_PRICE_JPY,
      });

      if (response.data?.boost_id) {
        // 有効化リクエスト
        await apiClient.post<BoostActivationResponse>(`/boost/activate/${response.data.boost_id}`);

        Alert.alert(
          "成功",
          "ブーストが有効化されました！30分間の上位表示と追加メッセージ10通（使い切り）が付与されました。",
        );
        router.back();
      }
    } catch (error) {
      console.error("Failed to purchase boost:", error);
      Alert.alert("エラー", "ブースト購入に失敗しました");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <ScreenBackHeader title="ブースト購入" onPress={() => router.back()} />
      <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 20 }}>
        <View style={{ marginBottom: 32, alignItems: "center" }}>
          <Text style={{ marginBottom: 8, fontSize: 30, fontWeight: "700", color: "#1f2937" }}>
            ブースト購入
          </Text>
        </View>

        <View
          style={{
            marginBottom: 32,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: "#f97316",
            backgroundColor: "#fff7ed",
            paddingHorizontal: 16,
            paddingVertical: 16,
          }}
        >
          <Text style={{ marginBottom: 8, fontSize: 16, fontWeight: "600", color: "#ea580c" }}>
            1回分
          </Text>
          <Text style={{ fontSize: 24, fontWeight: "700", color: "#f97316" }}>
            ¥{BOOST_PRICE_JPY.toLocaleString()}
          </Text>
        </View>

        <View
          style={{ marginBottom: 32, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16 }}
        >
          <Text style={{ marginBottom: 12, fontSize: 16, fontWeight: "600", color: "#1f2937" }}>
            ブースト特典
          </Text>
          <View style={{ marginBottom: 8, flexDirection: "row", alignItems: "flex-start" }}>
            <Text style={{ marginRight: 8, fontSize: 14, fontWeight: "700", color: "#16a34a" }}>
              ✓
            </Text>
            <Text style={{ flex: 1, fontSize: 14, color: "#374151" }}>
              追加メッセージ +10通（期限なし・使い切り）
            </Text>
          </View>
          <View style={{ marginBottom: 8, flexDirection: "row", alignItems: "flex-start" }}>
            <Text style={{ marginRight: 8, fontSize: 14, fontWeight: "700", color: "#16a34a" }}>
              ✓
            </Text>
            <Text style={{ flex: 1, fontSize: 14, color: "#374151" }}>
              有効化から30分間、検索で上位表示
            </Text>
          </View>
          <View style={{ marginBottom: 8, flexDirection: "row", alignItems: "flex-start" }}>
            <Text style={{ marginRight: 8, fontSize: 14, fontWeight: "700", color: "#16a34a" }}>
              ✓
            </Text>
            <Text style={{ flex: 1, fontSize: 14, color: "#374151" }}>
              返金不可（キャンセルは次回更新時）
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            {
              marginBottom: 12,
              alignItems: "center",
              borderRadius: 8,
              backgroundColor: "#f97316",
              paddingVertical: 14,
            },
            isProcessing ? { opacity: 0.6 } : undefined,
          ]}
          onPress={handlePurchase}
          disabled={isProcessing}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#ffffff" }}>
            {isProcessing ? "処理中..." : `¥${BOOST_PRICE_JPY.toLocaleString()} で購入`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
