import React, { useCallback, useState } from "react";
import { Alert, FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { ActionButton } from "../../components/common/ActionButton";
import { EmptyState } from "../../components/common/EmptyState";
import { LoadingState } from "../../components/common/LoadingState";
import { ScreenBackButton } from "../../components/common/ScreenBackButton";
import { SegmentedTab } from "../../components/common/SegmentedTab";
import { SectionCard } from "../../components/common/SectionCard";
import apiClient from "../../services/api";
import { useAuth } from "../../contexts/auth";
import { LiveStartErrorDetail, LiveStreamItem } from "../../types/live";
import { UserProfile } from "../../types/profile";
import { formatRankProgressLabel } from "../../utils/rankProgress";

const LIVE_TABS = [
  { key: "live", label: "配信中" },
  { key: "history", label: "配信履歴" },
] as const;

export function LiveScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [streams, setStreams] = useState<LiveStreamItem[]>([]);
  const [history, setHistory] = useState<LiveStreamItem[]>([]);
  const [myProfile, setMyProfile] = useState<Pick<UserProfile, "rank" | "rankProgress"> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [title, setTitle] = useState("");
  const [showStartForm, setShowStartForm] = useState(false);
  const [tab, setTab] = useState<"live" | "history">("live");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [streamsResponse, historyResponse, profileResponse] = await Promise.all([
        apiClient.get<LiveStreamItem[]>("/live"),
        apiClient.get<LiveStreamItem[]>("/live/my-history").catch(() => ({ data: [] })),
        apiClient.get<UserProfile>("/users/me").catch(() => ({ data: null })),
      ]);
      setStreams(streamsResponse.data || []);
      setHistory(historyResponse.data || []);
      setMyProfile(
        profileResponse?.data
          ? {
              rank: Number(profileResponse.data.rank || 1),
              rankProgress: profileResponse.data.rankProgress,
            }
          : null,
      );
    } catch (error) {
      console.error("Failed to fetch live data:", error);
      setStreams([]);
      setHistory([]);
      setMyProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const currentRank = Number(myProfile?.rank || 1);
  const rankProgress = myProfile?.rankProgress;
  const canStartLive = currentRank >= 5;

  const handleStart = async () => {
    if (!canStartLive) {
      const progressText = formatRankProgressLabel(rankProgress);
      Alert.alert(
        "ランク条件未達",
        progressText
          ? `ライブ配信はRank5以上で解放されます。\n\n次ランク条件: ${progressText}`
          : "ライブ配信はRank5以上で解放されます。",
        [
          { text: "閉じる", style: "cancel" },
          { text: "次ランク条件を見る", onPress: () => router.push("/(tabs)/profile?focus=rank") },
        ],
      );
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert("入力エラー", "配信タイトルを入力してください");
      return;
    }

    try {
      setStarting(true);
      const response = await apiClient.post<LiveStreamItem>("/live/start", { title: trimmedTitle });
      setTitle("");
      setShowStartForm(false);
      router.push(`/live/${response.data.id}`);
    } catch (error: any) {
      const rawDetail = error?.response?.data?.detail;
      const detailObj: LiveStartErrorDetail | null =
        rawDetail && typeof rawDetail === "object" ? rawDetail : null;
      const baseMessage =
        (typeof rawDetail === "string" ? rawDetail : detailObj?.message) ||
        "配信開始に失敗しました";
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
      setStarting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0f0f0f" }}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 20,
          paddingBottom: 12,
          backgroundColor: "#1a1a1a",
        }}
      >
        <ScreenBackButton
          onPress={() => router.back()}
          variant="dark"
          style={{ paddingRight: 12 }}
          textStyle={{ color: "#9ca3af", fontSize: 16 }}
        />
        <Text style={{ marginBottom: 4, fontSize: 24, fontWeight: "700", color: "#ffffff" }}>
          🔴 ライブ配信
        </Text>
        <Text style={{ fontSize: 14, color: "#9ca3af" }}>
          配信一覧の閲覧と、自分の配信管理ができます
        </Text>
      </View>

      <TouchableOpacity
        style={{
          margin: 12,
          alignItems: "center",
          borderRadius: 12,
          borderWidth: 1,
          paddingVertical: 14,
          backgroundColor: "#1a1a1a",
          borderColor: "#ef4444",
        }}
        onPress={() => {
          if (canStartLive) {
            setShowStartForm((prev) => !prev);
            return;
          }
          router.push("/(tabs)/profile?focus=rank");
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#ef4444" }}>
          {canStartLive ? (showStartForm ? "閉じる" : "＋ 配信を開始する") : "🔒 Rank5で配信解放"}
        </Text>
      </TouchableOpacity>

      {!canStartLive && (
        <SectionCard
          style={{
            marginHorizontal: 12,
            marginBottom: 10,
            backgroundColor: "#1a1a1a",
            borderRadius: 10,
            paddingVertical: 12,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: "#374151",
          }}
        >
          <Text style={{ marginBottom: 6, fontSize: 14, fontWeight: "700" }}>配信解放条件</Text>
          <Text style={{ marginBottom: 4, fontSize: 12, fontWeight: "600", color: "#9ca3af" }}>
            現在ランク: Rank {currentRank}
          </Text>
          {rankProgress && !rankProgress.isMaxRank ? (
            <>
              <Text style={{ marginBottom: 4, fontSize: 12, fontWeight: "600", color: "#9ca3af" }}>
                次ランク: Rank {rankProgress.nextRank}
              </Text>
              {rankProgress.items.map((item) => {
                const unit = item.unit || "";
                return (
                  <Text key={item.key} style={{ marginBottom: 4, fontSize: 12 }}>
                    {item.done ? "✓" : "・"} {item.label} {item.currentValue}
                    {unit}/{item.requiredValue}
                    {unit}
                  </Text>
                );
              })}
            </>
          ) : (
            <Text style={{ marginBottom: 4, fontSize: 12 }}>
              プロフィール画面で次ランク条件を確認できます
            </Text>
          )}
          <ActionButton
            label="次ランク条件を見る"
            variant="neutral"
            style={{
              marginTop: 8,
              alignSelf: "flex-start",
              borderRadius: 8,
              backgroundColor: "#374151",
              paddingVertical: 8,
              paddingHorizontal: 10,
            }}
            textStyle={{ fontSize: 12, color: "#e5e7eb", fontWeight: "700" }}
            onPress={() => router.push("/(tabs)/profile?focus=rank")}
          />
        </SectionCard>
      )}

      {showStartForm && (
        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          <TextInput
            style={{
              backgroundColor: "#1e1e1e",
              borderWidth: 1,
              borderColor: "#374151",
              borderRadius: 8,
              paddingHorizontal: 14,
              paddingVertical: 10,
              color: "#ffffff",
              fontSize: 15,
              marginBottom: 12,
            }}
            placeholder="配信タイトル"
            placeholderTextColor="#6b7280"
            value={title}
            onChangeText={setTitle}
          />
          <ActionButton
            label={starting ? "開始中..." : "配信開始"}
            style={[
              {
                backgroundColor: "#ef4444",
                borderRadius: 8,
                paddingVertical: 12,
                alignItems: "center",
              },
              starting ? { opacity: 0.5 } : undefined,
            ]}
            textStyle={{ color: "#ffffff", fontSize: 15, fontWeight: "700" }}
            disabled={starting}
            onPress={handleStart}
          />
        </View>
      )}

      <SegmentedTab
        items={LIVE_TABS}
        value={tab}
        onChange={setTab}
        containerStyle={{ paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#1a1a1a" }}
      />

      {loading ? (
        <LoadingState
          color="#ef4444"
          containerStyle={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#0f0f0f",
          }}
        />
      ) : tab === "live" ? (
        <FlatList
          data={streams}
          keyExtractor={(item) => item.id.toString()}
          onRefresh={fetchData}
          refreshing={loading}
          renderItem={({ item }) => (
            <SectionCard
              style={{
                marginHorizontal: 12,
                marginVertical: 6,
                backgroundColor: "#1e1e1e",
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: "#2d2d2d",
              }}
            >
              <View style={{ marginBottom: 8, flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{ height: 8, width: 8, borderRadius: 9999, backgroundColor: "#ef4444" }}
                />
                <Text
                  style={{ fontSize: 12, fontWeight: "700", color: "#ef4444", letterSpacing: 1 }}
                >
                  LIVE
                </Text>
              </View>
              <Text style={{ marginBottom: 4, fontSize: 16, fontWeight: "700", color: "#ffffff" }}>
                {item.title}
              </Text>
              <Text style={{ marginBottom: 10, fontSize: 14, color: "#9ca3af" }}>
                {item.broadcaster_name}
              </Text>
              <View style={{ flexDirection: "row", gap: 16 }}>
                <Text style={{ fontSize: 12, color: "#6b7280" }}>👁 {item.viewer_count}人</Text>
                <Text style={{ fontSize: 12, color: "#6b7280" }}>
                  💰 ¥{item.total_tipping_jpy.toLocaleString()}
                </Text>
              </View>
              <ActionButton
                label={user?.id === item.broadcaster_id ? "配信を管理" : "視聴する"}
                style={{
                  backgroundColor: "#ef4444",
                  borderRadius: 8,
                  paddingVertical: 10,
                  alignItems: "center",
                  marginTop: 10,
                }}
                textStyle={{ color: "#ffffff", fontSize: 14, fontWeight: "700" }}
                onPress={() => router.push(`/live/${item.id}`)}
              />
            </SectionCard>
          )}
          ListEmptyComponent={
            <EmptyState
              message="現在配信中のライブはありません"
              containerStyle={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingTop: 80,
              }}
              textStyle={{ fontSize: 14, color: "#6b7280", textAlign: "center" }}
            />
          }
        />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id.toString()}
          onRefresh={fetchData}
          refreshing={loading}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{
                marginHorizontal: 12,
                borderRadius: 12,
                padding: 12,
                backgroundColor: "#1e1e1e",
              }}
              onPress={() => router.push(`/live/${item.id}`)}
            >
              <Text style={{ marginBottom: 4, fontSize: 14, fontWeight: "600" }}>{item.title}</Text>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>
                {new Date(item.started_at).toLocaleString("ja-JP")} ・ ¥
                {item.total_tipping_jpy.toLocaleString()}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <EmptyState
              message="まだ配信履歴はありません"
              containerStyle={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingTop: 80,
              }}
              textStyle={{ fontSize: 14, color: "#6b7280", textAlign: "center" }}
            />
          }
        />
      )}
    </View>
  );
}
