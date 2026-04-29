import React, { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import apiClient from "@/src/services/api";
import { BoostActivationResponse, BoostPurchaseResponse } from "@/src/types/boost";

type BoostPlan = {
  key: string;
  label: string;
  duration_days: number;
  price_jpy: number;
  discount_rate: number; // % 割引
};

const BOOST_PLANS: BoostPlan[] = [
  { key: "7d", label: "7日間", duration_days: 7, price_jpy: 500, discount_rate: 0 },
  { key: "30d", label: "30日間", duration_days: 30, price_jpy: 1500, discount_rate: 10 },
  { key: "90d", label: "90日間", duration_days: 90, price_jpy: 3500, discount_rate: 23 },
];

export function BoostPurchaseScreen() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string>("7d");
  const [isProcessing, setIsProcessing] = useState(false);

  const current_plan = BOOST_PLANS.find((p) => p.key === selectedPlan) || BOOST_PLANS[0];

  const handlePurchase = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);

      // Backend に購入リクエスト
      const response = await apiClient.post<BoostPurchaseResponse>("/boost/purchase", {
        duration_days: current_plan.duration_days,
        price_jpy: current_plan.price_jpy,
      });

      if (response.data?.boost_id) {
        // 有効化リクエスト
        await apiClient.post<BoostActivationResponse>(`/boost/activate/${response.data.boost_id}`);

        Alert.alert("成功", "ブーストが有効化されました！チャット送信上限が増加しました。");
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
    <ScrollView
      style={{ flex: 1, backgroundColor: "#ffffff", paddingHorizontal: 16, paddingVertical: 20 }}
    >
      <View style={{ marginBottom: 32, alignItems: "center" }}>
        <Text style={{ marginBottom: 8, fontSize: 30, fontWeight: "700", color: "#1f2937" }}>
          ブースト購入
        </Text>
        <Text style={{ textAlign: "center", fontSize: 14, color: "#6b7280" }}>
          メッセージ送信上限を +10 通 増加できます
        </Text>
      </View>

      <View style={{ marginBottom: 32, gap: 12 }}>
        {BOOST_PLANS.map((plan) => (
          <TouchableOpacity
            key={plan.key}
            style={[
              {
                position: "relative",
                borderRadius: 12,
                borderWidth: 2,
                paddingHorizontal: 16,
                paddingVertical: 16,
              },
              {
                borderColor: selectedPlan === plan.key ? "#f97316" : "#e5e7eb",
                backgroundColor: selectedPlan === plan.key ? "#fff7ed" : "#f9fafb",
              },
            ]}
            onPress={() => setSelectedPlan(plan.key)}
          >
            <Text
              style={[
                { marginBottom: 8, fontSize: 16, fontWeight: "600" },
                { color: selectedPlan === plan.key ? "#ea580c" : "#374151" },
              ]}
            >
              {plan.label}
            </Text>
            <Text
              style={[
                { fontSize: 24, fontWeight: "700" },
                { color: selectedPlan === plan.key ? "#f97316" : "#1f2937" },
              ]}
            >
              ¥{plan.price_jpy.toLocaleString()}
            </Text>
            {plan.discount_rate > 0 && (
              <View
                style={{
                  position: "absolute",
                  borderRadius: 6,
                  backgroundColor: "#ef4444",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#ffffff" }}>
                  {plan.discount_rate}% OFF
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
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
          <Text style={{ flex: 1, fontSize: 14, color: "#374151" }}>メッセージ送信上限 +10 通</Text>
        </View>
        <View style={{ marginBottom: 8, flexDirection: "row", alignItems: "flex-start" }}>
          <Text style={{ marginRight: 8, fontSize: 14, fontWeight: "700", color: "#16a34a" }}>
            ✓
          </Text>
          <Text style={{ flex: 1, fontSize: 14, color: "#374151" }}>
            期間中はいつでも有効化可能
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
          {isProcessing ? "処理中..." : `¥${current_plan.price_jpy.toLocaleString()} で購入`}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          marginBottom: 20,
          alignItems: "center",
          borderRadius: 8,
          borderWidth: 1,
          borderColor: "#d1d5db",
          paddingVertical: 14,
        }}
        onPress={() => router.back()}
      >
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#6b7280" }}>キャンセル</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
