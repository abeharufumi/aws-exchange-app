import React, { useEffect, useState } from "react";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { EmptyState } from "@/src/components/common/EmptyState";
import { LoadingState } from "@/src/components/common/LoadingState";
import apiClient from "@/src/services/api";
import { RankProgress } from "@/src/types/profile";
import { FootprintItem } from "@/src/types/user";
import { formatRankProgressLabel } from "@/src/utils/rankProgress";

type FootprintLockDetail = {
  message?: string;
  currentRank?: number;
  requiredRank?: number;
  rankProgress?: RankProgress;
};

export function FootprintScreen() {
  const router = useRouter();
  const [footprints, setFootprints] = useState<FootprintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [canView, setCanView] = useState(true);
  const [limitMessage, setLimitMessage] = useState("");
  const [lockProgressMessage, setLockProgressMessage] = useState("");

  useEffect(() => {
    fetchFootprints();
  }, []);

  const fetchFootprints = async () => {
    try {
      const response = await apiClient.get<FootprintItem[]>("/users/footprints/my-footprints");
      setFootprints(response.data || []);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        const rawDetail = error?.response?.data?.detail;
        const detailObj: FootprintLockDetail | null =
          rawDetail && typeof rawDetail === "object" ? rawDetail : null;
        const baseMessage =
          (typeof rawDetail === "string" ? rawDetail : detailObj?.message) ||
          "足跡機能はRank3以上で利用可能です";
        const progressText = formatRankProgressLabel(detailObj?.rankProgress);
        setCanView(false);
        setLimitMessage(baseMessage);
        setLockProgressMessage(progressText || "");
      } else {
        console.error("Failed to fetch footprints:", error);
        Alert.alert("エラー", "足跡の取得に失敗しました");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatViewedAt = (timestamp: string): string => {
    try {
      const utc = timestamp.endsWith("Z") ? timestamp : timestamp + "Z";
      const date = new Date(utc);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffMins < 1) return "今";
      if (diffMins < 60) return `${diffMins}分前`;
      if (diffHours < 24) return `${diffHours}時間前`;
      if (diffDays < 7) return `${diffDays}日前`;
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${month}/${day}`;
    } catch {
      return "不明";
    }
  };

  if (loading) return <LoadingState color="#e74c3c" />;

  if (!canView) {
    return (
      <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}
        >
          <Text style={{ fontSize: 24, fontWeight: "700", color: "#1f2937", marginBottom: 12 }}>
            足跡機能
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#374151",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            {limitMessage}
          </Text>
          {lockProgressMessage ? (
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: "#374151",
                textAlign: "center",
                marginBottom: 10,
              }}
            >
              次ランク条件: {lockProgressMessage}
            </Text>
          ) : null}
          <Text
            style={{
              fontSize: 12,
              color: "#6b7280",
              textAlign: "center",
              lineHeight: 28,
              marginBottom: 12,
            }}
          >
            Rank3以上になると自分のプロフィールを訪問してくれたユーザーが表示されます
          </Text>
          <TouchableOpacity
            style={{
              marginTop: 4,
              borderRadius: 8,
              backgroundColor: "#374151",
              paddingVertical: 10,
              paddingHorizontal: 12,
            }}
            onPress={() => router.push("/(tabs)/profile?focus=rank")}
          >
            <Text style={{ fontSize: 14, fontWeight: "700" }}>次ランク条件を見る</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      {footprints.length === 0 ? (
        <EmptyState
          message="足跡がまだありません"
          containerStyle={{ flex: 1, paddingHorizontal: 24 }}
          textStyle={{ fontSize: 14, color: "#9ca3af" }}
        />
      ) : (
        <FlatList
          data={footprints}
          keyExtractor={(item) => `${item.visitorId}-${item.viewedAt}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderBottomWidth: 1,
                borderColor: "#f3f4f6",
              }}
              onPress={() => router.push(`/user/${item.visitorId}`)}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 14, fontWeight: "600", color: "#1f2937", marginBottom: 4 }}
                >
                  {item.visitorName}
                </Text>
                <Text style={{ fontSize: 12, color: "#9ca3af" }}>
                  {formatViewedAt(item.viewedAt)}
                </Text>
              </View>
              <Text style={{ fontSize: 20, marginLeft: 8 }}>›</Text>
            </TouchableOpacity>
          )}
          scrollEnabled={true}
        />
      )}
    </View>
  );
}
