import React, { useCallback, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { EmptyState } from "../../components/common/EmptyState";
import { LoadingState } from "../../components/common/LoadingState";
import { ScreenBackButton } from "../../components/common/ScreenBackButton";
import apiClient from "../../services/api";
import { useAuth } from "../../contexts/auth";
import {
  EndStreamResponse,
  LiveStreamItem,
  LiveTipRestrictionDetail,
  TipResponse,
} from "../../types/live";
import { RankProgress } from "../../types/profile";

const TIP_AMOUNTS = [100, 300, 500, 1000, 3000, 5000];

function formatRankProgressLabel(progress?: RankProgress): string | null {
  if (!progress || progress.isMaxRank) {
    return null;
  }
  const pendingItem = progress.items.find((item) => !item.done);
  const targetItem = pendingItem || progress.items[0];
  if (!targetItem) {
    return null;
  }
  const unit = targetItem.unit || "";
  return `${targetItem.label} ${targetItem.currentValue}${unit}/${targetItem.requiredValue}${unit}`;
}

export function LiveDetailScreen({ route }: { route: { params: { streamId: string } } }) {
  const router = useRouter();
  const { user } = useAuth();
  const streamId = Number(route.params.streamId);
  const [stream, setStream] = useState<LiveStreamItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingAmount, setProcessingAmount] = useState<number | null>(null);
  const [ending, setEnding] = useState(false);

  const fetchStream = useCallback(async () => {
    if (!Number.isFinite(streamId)) {
      setStream(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.get<LiveStreamItem>(`/live/${streamId}`);
      setStream(response.data);
    } catch (error) {
      console.error("Failed to fetch stream:", error);
      setStream(null);
    } finally {
      setLoading(false);
    }
  }, [streamId]);

  useFocusEffect(
    useCallback(() => {
      fetchStream();
    }, [fetchStream]),
  );

  const handleTip = async (amount: number) => {
    if (!stream || processingAmount !== null) {
      return;
    }

    try {
      setProcessingAmount(amount);
      await apiClient.post<TipResponse>(`/live/${stream.id}/tip`, { amount_jpy: amount });
      Alert.alert("送信完了", `¥${amount.toLocaleString()} の投げ銭を送りました`);
      await fetchStream();
    } catch (error: any) {
      const rawDetail = error?.response?.data?.detail;
      const detailObj: LiveTipRestrictionDetail | null =
        rawDetail && typeof rawDetail === "object" ? rawDetail : null;
      const baseMessage =
        (typeof rawDetail === "string" ? rawDetail : detailObj?.message) || "投げ銭に失敗しました";
      const progressText = formatRankProgressLabel(detailObj?.rankProgress);

      if (error?.response?.status === 403 && detailObj?.requiredRank === 5) {
        Alert.alert(
          "投げ銭を送れません",
          progressText ? `${baseMessage}\n\n次ランク条件: ${progressText}` : baseMessage,
          [
            { text: "閉じる", style: "cancel" },
            {
              text: "配信者プロフィールを見る",
              onPress: () => {
                const targetUserId = detailObj?.broadcasterId || stream.broadcaster_id;
                router.push({
                  pathname: "/user/[id]",
                  params: { id: String(targetUserId) },
                });
              },
            },
          ],
        );
      } else if (error?.response?.status === 403 && detailObj?.requiredGender) {
        const genderNote = detailObj?.broadcasterGender
          ? `\n配信者の性別: ${
              detailObj.broadcasterGender === "female"
                ? "女性"
                : detailObj.broadcasterGender === "male"
                  ? "男性"
                  : detailObj.broadcasterGender
            }`
          : "";
        Alert.alert("投げ銭を送れません", `${baseMessage}${genderNote}`);
      } else {
        Alert.alert("エラー", baseMessage);
      }
    } finally {
      setProcessingAmount(null);
    }
  };

  const handleEnd = async () => {
    if (!stream || ending) {
      return;
    }

    try {
      setEnding(true);
      await apiClient.post<EndStreamResponse>(`/live/${stream.id}/end`);
      Alert.alert("配信終了", "配信を終了しました");
      router.back();
    } catch (error: any) {
      Alert.alert("エラー", error?.response?.data?.detail || "配信終了に失敗しました");
    } finally {
      setEnding(false);
    }
  };

  if (loading) {
    return (
      <LoadingState
        color="#ef4444"
        containerStyle={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0f0f0f",
        }}
      />
    );
  }

  if (!stream) {
    return (
      <View style={{ flex: 1, backgroundColor: "#030712" }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#0a0a0a",
            paddingHorizontal: 16,
            paddingBottom: 12,
            paddingTop: 16,
          }}
        >
          <ScreenBackButton
            onPress={() => router.back()}
            style={{ paddingRight: 12 }}
            textStyle={{ color: "#9ca3af", fontSize: 16 }}
            variant="dark"
          />
        </View>
        <EmptyState
          message="配信が見つかりません"
          containerStyle={{ flex: 1 }}
          textStyle={{ fontSize: 14, color: "#6b7280", textAlign: "center" }}
        />
      </View>
    );
  }

  const isMyStream = user?.id === stream.broadcaster_id;

  return (
    <View style={{ flex: 1, backgroundColor: "#030712" }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#0a0a0a",
          paddingHorizontal: 16,
          paddingBottom: 12,
          paddingTop: 16,
        }}
      >
        <ScreenBackButton
          onPress={() => router.back()}
          style={{ paddingRight: 12 }}
          textStyle={{ color: "#9ca3af", fontSize: 16 }}
          variant="dark"
        />
        <Text
          style={{ flex: 1, fontSize: 16, fontWeight: "700", color: "#ffffff" }}
          numberOfLines={1}
        >
          {stream.title}
        </Text>
      </View>

      <Text style={{ marginTop: 8, paddingHorizontal: 16, color: "#9ca3af" }}>
        配信者: {stream.broadcaster_name}
      </Text>
      <Text style={{ marginTop: 8, paddingHorizontal: 16, color: "#9ca3af" }}>
        状態: {stream.status === "live" ? "配信中" : "終了"}
      </Text>
      <Text style={{ marginTop: 8, paddingHorizontal: 16, color: "#9ca3af" }}>
        視聴者数: {stream.viewer_count}人
      </Text>
      <Text style={{ marginTop: 16, paddingHorizontal: 16, fontSize: 14 }}>
        累計投げ銭: ¥{stream.total_tipping_jpy.toLocaleString()}
      </Text>

      {!isMyStream && stream.status === "live" && (
        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          <Text style={{ marginBottom: 12, fontSize: 14, fontWeight: "700" }}>投げ銭する</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {TIP_AMOUNTS.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  { borderRadius: 9999, paddingVertical: 8 },
                  { backgroundColor: processingAmount !== null ? "#374151" : "#2d2d2d" },
                ]}
                disabled={processingAmount !== null}
                onPress={() => handleTip(amount)}
              >
                <Text style={{ fontWeight: "600" }}>
                  {processingAmount === amount ? "送信中..." : `¥${amount.toLocaleString()}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {isMyStream && stream.status === "live" && (
        <TouchableOpacity
          style={[
            {
              marginHorizontal: 16,
              marginTop: 24,
              alignItems: "center",
              borderRadius: 8,
              backgroundColor: "#374151",
              paddingVertical: 12,
            },
            ending ? { opacity: 0.5 } : undefined,
          ]}
          disabled={ending}
          onPress={handleEnd}
        >
          <Text style={{ fontSize: 14, fontWeight: "600" }}>
            {ending ? "終了中..." : "■ 配信を終了する"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
