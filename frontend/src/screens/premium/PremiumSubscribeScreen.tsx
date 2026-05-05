import React, { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenBackHeader } from "@/src/components/common/ScreenBackHeader";
import apiClient from "@/src/services/api";
import { PremiumSubscriptionResponse } from "@/src/types/premium";

type PremiumPlan = {
  key: string;
  label: string;
  duration_months: number;
  price_jpy: number;
  monthly_effective_price: number; // 月額換算
  discount_rate: number; // % 割引
};

const PREMIUM_PLANS: PremiumPlan[] = [
  {
    key: "1m",
    label: "1ヶ月",
    duration_months: 1,
    price_jpy: 980,
    monthly_effective_price: 980,
    discount_rate: 0,
  },
  {
    key: "3m",
    label: "3ヶ月",
    duration_months: 3,
    price_jpy: 2700,
    monthly_effective_price: 900,
    discount_rate: 8,
  },
  {
    key: "12m",
    label: "12ヶ月",
    duration_months: 12,
    price_jpy: 9800,
    monthly_effective_price: 817,
    discount_rate: 17,
  },
];

export function PremiumSubscribeScreen() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string>("1m");
  const [isProcessing, setIsProcessing] = useState(false);

  const current_plan = PREMIUM_PLANS.find((p) => p.key === selectedPlan) || PREMIUM_PLANS[0];

  const handleSubscribe = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);

      // Backend に加入リクエスト
      const response = await apiClient.post<PremiumSubscriptionResponse>("/premium/subscribe", {
        duration_months: current_plan.duration_months,
        monthly_price_jpy: current_plan.price_jpy / current_plan.duration_months,
      });

      if (response.data?.subscription_id) {
        Alert.alert("成功", "プレミアム会員に加入しました！メッセージ送信が無制限になります。");
        router.back();
      }
    } catch (error) {
      console.error("Failed to subscribe premium:", error);
      Alert.alert("エラー", "プレミアム加入に失敗しました");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <ScreenBackHeader title="プレミアム購入" onPress={() => router.back()} />
      <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 20 }}>
        <View style={{ marginBottom: 32, alignItems: "center" }}>
          <Text style={{ marginBottom: 8, fontSize: 30, fontWeight: "700", color: "#1f2937" }}>
            プレミアム会員になる
          </Text>
          <Text style={{ textAlign: "center", fontSize: 14, color: "#6b7280" }}>
            送信上限 +20 通 / すべての受信設定が解放されます
          </Text>
        </View>

        <View
          style={{
            marginBottom: 32,
            borderRadius: 12,
            backgroundColor: "#fffbeb",
            paddingHorizontal: 16,
            paddingVertical: 16,
          }}
        >
          <Text style={{ marginBottom: 12, fontSize: 16, fontWeight: "600", color: "#1f2937" }}>
            プレミアム特典
          </Text>
          <View style={{ marginBottom: 8, flexDirection: "row", alignItems: "flex-start" }}>
            <Text style={{ marginRight: 8, fontSize: 14, fontWeight: "700", color: "#16a34a" }}>
              ✓
            </Text>
            <Text style={{ flex: 1, fontSize: 14, color: "#374151" }}>
              メッセージ送信上限 +20 通
            </Text>
          </View>
          <View style={{ marginBottom: 8, flexDirection: "row", alignItems: "flex-start" }}>
            <Text style={{ marginRight: 8, fontSize: 14, fontWeight: "700", color: "#16a34a" }}>
              ✓
            </Text>
            <Text style={{ flex: 1, fontSize: 14, color: "#374151" }}>
              すべての受信設定（age/rank/image）解除
            </Text>
          </View>
          <View style={{ marginBottom: 8, flexDirection: "row", alignItems: "flex-start" }}>
            <Text style={{ marginRight: 8, fontSize: 14, fontWeight: "700", color: "#16a34a" }}>
              ✓
            </Text>
            <Text style={{ flex: 1, fontSize: 14, color: "#374151" }}>優先表示・特別バッジ</Text>
          </View>
        </View>

        <View style={{ marginBottom: 32, gap: 12 }}>
          {PREMIUM_PLANS.map((plan) => (
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
              <Text
                style={[
                  { marginTop: 4, fontSize: 14 },
                  { color: selectedPlan === plan.key ? "#ea580c" : "#6b7280" },
                ]}
              >
                月あたり ¥{plan.monthly_effective_price.toLocaleString()}
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
          style={{
            marginBottom: 32,
            borderRadius: 12,
            backgroundColor: "#f3f4f6",
            paddingHorizontal: 16,
            paddingVertical: 16,
          }}
        >
          <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: "600", color: "#1f2937" }}>
            利用規約
          </Text>
          <Text style={{ marginBottom: 4, fontSize: 12, color: "#6b7280" }}>
            • 月額自動更新されます
          </Text>
          <Text style={{ marginBottom: 4, fontSize: 12, color: "#6b7280" }}>
            • いつでも解約可能です
          </Text>
          <Text style={{ marginBottom: 4, fontSize: 12, color: "#6b7280" }}>
            • 返金はできません
          </Text>
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
          onPress={handleSubscribe}
          disabled={isProcessing}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#ffffff" }}>
            {isProcessing ? "処理中..." : `¥${current_plan.price_jpy.toLocaleString()} で加入`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
