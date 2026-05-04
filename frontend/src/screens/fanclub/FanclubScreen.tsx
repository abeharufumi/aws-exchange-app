import React, { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ActionButton } from "../../components/common/ActionButton";
import { EmptyState } from "../../components/common/EmptyState";
import { LoadingState } from "../../components/common/LoadingState";
import { ScreenBackButton } from "../../components/common/ScreenBackButton";
import { SegmentedTab } from "../../components/common/SegmentedTab";
import apiClient from "../../services/api";
import {
  CreatorRestrictionDetail,
  FanclubCancelResponse,
  FanclubCreatorInfo,
  FanclubMemberItem,
  FanclubSubscribeResponse,
  FanclubSubscriptionItem,
  MembersRestrictionDetail,
} from "../../types/fanclub";
import { RankProgress } from "../../types/profile";

function formatRankProgressLabelForAlert(progress?: RankProgress): string | null {
  if (!progress || progress.isMaxRank || !progress.items?.length) {
    return null;
  }
  const pendingItem = progress.items.find((item) => !item.done);
  const targetItem = pendingItem || progress.items[0];
  if (!targetItem) {
    return null;
  }
  const suffix = targetItem.unit ? targetItem.unit : "";
  return `${targetItem.label}: ${targetItem.currentValue}/${targetItem.requiredValue}${suffix}`;
}

const FANCLUB_TABS = [
  { key: "subscriptions", label: "加入中" },
  { key: "members", label: "自分のメンバー" },
] as const;

export function FanclubScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<"subscriptions" | "members">("subscriptions");
  const [subscriptions, setSubscriptions] = useState<FanclubSubscriptionItem[]>([]);
  const [members, setMembers] = useState<FanclubMemberItem[]>([]);
  const [membersRestriction, setMembersRestriction] = useState<MembersRestrictionDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const formatRankProgressLabel = (progress?: RankProgress | null): string => {
    if (!progress || progress.isMaxRank || !progress.items?.length) {
      return "";
    }
    const pendingItem = progress.items.find((item) => !item.done);
    if (!pendingItem) {
      return "";
    }
    const suffix = pendingItem.unit ? pendingItem.unit : "";
    return `${pendingItem.label}: ${pendingItem.currentValue}/${pendingItem.requiredValue}${suffix}`;
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setMembersRestriction(null);
      const subscriptionsResponse = await apiClient.get<FanclubSubscriptionItem[]>(
        "/fanclub/my-subscriptions",
      );
      let membersResponse: { data: FanclubMemberItem[] } = { data: [] };
      try {
        const response = await apiClient.get<FanclubMemberItem[]>("/fanclub/my-members");
        membersResponse = { data: response.data || [] };
      } catch (error: any) {
        const detail = error?.response?.data?.detail;
        if (
          error?.response?.status === 403 &&
          detail &&
          typeof detail === "object" &&
          typeof detail.message === "string"
        ) {
          setMembersRestriction(detail as MembersRestrictionDetail);
          membersResponse = { data: [] };
        } else {
          throw error;
        }
      }
      setSubscriptions(subscriptionsResponse.data || []);
      setMembers(membersResponse.data || []);
    } catch (error) {
      console.error("Failed to fetch fanclub data:", error);
      setSubscriptions([]);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancel = async (creatorId: number, creatorName: string) => {
    Alert.alert("解約確認", `${creatorName} のファンクラブを解約しますか？`, [
      { text: "キャンセル" },
      {
        text: "解約する",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.post<FanclubCancelResponse>(`/fanclub/cancel/${creatorId}`);
            await fetchData();
          } catch (error: any) {
            Alert.alert("エラー", error?.response?.data?.detail || "解約に失敗しました");
          }
        },
      },
    ]);
  };

  const renderStatusText = (status: string) => {
    if (status === "active") {
      return "有効";
    }
    if (status === "cancelled") {
      return "解約済み";
    }
    return "期限切れ";
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <View
        style={{
          borderBottomWidth: 1,
          borderColor: "#f3f4f6",
          backgroundColor: "#ffffff",
          paddingHorizontal: 16,
          paddingTop: 20,
        }}
      >
        <ScreenBackButton
          onPress={() => router.back()}
          style={{ paddingBottom: 10 }}
          textStyle={{ color: "#6b7280", fontSize: 15 }}
        />
        <Text style={{ marginBottom: 4, fontWeight: "700", color: "#111827" }}>
          💜 ファンクラブ
        </Text>
        <Text style={{ color: "#6b7280" }}>加入一覧と自分のメンバーを確認できます</Text>
      </View>

      <SegmentedTab items={FANCLUB_TABS} value={tab} onChange={setTab} />

      {loading ? (
        <LoadingState
          color="#7c3aed"
          containerStyle={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        />
      ) : tab === "subscriptions" ? (
        <FlatList
          data={subscriptions}
          keyExtractor={(item) => `${item.creator_id}`}
          onRefresh={fetchData}
          refreshing={loading}
          renderItem={({ item }) => (
            <View
              style={{
                marginHorizontal: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                backgroundColor: "#ffffff",
                padding: 14,
              }}
            >
              <Text style={{ marginBottom: 4, fontWeight: "600", color: "#111827" }}>
                {item.creator_name}
              </Text>
              <Text style={{ marginBottom: 2, fontSize: 12, color: "#6b7280" }}>
                月額 ¥{item.monthly_price_jpy.toLocaleString()}
              </Text>
              <Text style={{ marginBottom: 2, fontSize: 12, color: "#6b7280" }}>
                開始日: {new Date(item.joined_at).toLocaleDateString("ja-JP")}
              </Text>
              {item.expires_at && (
                <Text style={{ marginBottom: 2, fontSize: 12, color: "#6b7280" }}>
                  期限: {new Date(item.expires_at).toLocaleDateString("ja-JP")}
                </Text>
              )}
              <Text
                style={[
                  { marginBottom: 2, fontSize: 12 },
                  {
                    color: item.status === "active" ? "#059669" : "#9ca3af",
                    fontWeight: item.status === "active" ? "600" : "400",
                  },
                ]}
              >
                状態: {renderStatusText(item.status)}
              </Text>
              {item.status === "active" && (
                <ActionButton
                  label="解約する"
                  variant="neutral"
                  onPress={() => handleCancel(item.creator_id, item.creator_name)}
                  style={{
                    marginTop: 8,
                    borderRadius: 8,
                    paddingVertical: 10,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "#d1d5db",
                  }}
                  textStyle={{ color: "#6b7280", fontSize: 13 }}
                />
              )}
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              message="加入中のファンクラブはありません"
              textStyle={{ textAlign: "center", color: "#9ca3af", paddingTop: 40, fontSize: 14 }}
            />
          }
        />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => `${item.member_id}`}
          onRefresh={fetchData}
          refreshing={loading}
          renderItem={({ item }) => (
            <View
              style={{
                marginHorizontal: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                backgroundColor: "#ffffff",
                padding: 14,
              }}
            >
              <Text style={{ marginBottom: 4, fontWeight: "600", color: "#111827" }}>
                {item.member_name}
              </Text>
              <Text style={{ marginBottom: 2, fontSize: 12, color: "#6b7280" }}>
                参加日: {new Date(item.joined_at).toLocaleDateString("ja-JP")}
              </Text>
              {item.expires_at && (
                <Text style={{ marginBottom: 2, fontSize: 12, color: "#6b7280" }}>
                  期限: {new Date(item.expires_at).toLocaleDateString("ja-JP")}
                </Text>
              )}
              <Text style={{ marginBottom: 2, fontSize: 12, color: "#6b7280" }}>
                月額 ¥{item.monthly_price_jpy.toLocaleString()}
              </Text>
            </View>
          )}
          ListHeaderComponent={
            membersRestriction ? (
              <View
                style={{
                  marginHorizontal: 12,
                  marginBottom: 8,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#ddd6fe",
                  backgroundColor: "#f5f3ff",
                  padding: 12,
                }}
              >
                <Text
                  style={{ marginBottom: 4, fontSize: 14, fontWeight: "700", color: "#6d28d9" }}
                >
                  メンバー管理は未解放です
                </Text>
                <Text style={{ marginBottom: 4, fontSize: 12, color: "#6b7280" }}>
                  {membersRestriction.message}
                </Text>
                {membersRestriction.requiredRank && membersRestriction.currentRank ? (
                  <Text style={{ marginBottom: 4, fontSize: 12, color: "#6b7280" }}>
                    現在ランク: Rank{membersRestriction.currentRank} / 必要ランク: Rank
                    {membersRestriction.requiredRank}
                  </Text>
                ) : null}
                {formatRankProgressLabel(membersRestriction.rankProgress) ? (
                  <Text
                    style={{ marginBottom: 8, fontSize: 12, fontWeight: "600", color: "#6d28d9" }}
                  >
                    次ランク目安: {formatRankProgressLabel(membersRestriction.rankProgress)}
                  </Text>
                ) : null}
                <ActionButton
                  label="次ランク条件を見る"
                  variant="neutral"
                  onPress={() => router.push("/(tabs)/profile?focus=rank")}
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: "#7c3aed",
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 7,
                  }}
                  textStyle={{ color: "#ffffff", fontSize: 12, fontWeight: "700" }}
                />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              message={
                membersRestriction
                  ? "Rank5になるとメンバー管理が解放されます"
                  : "メンバーはまだいません"
              }
              textStyle={{ textAlign: "center", color: "#9ca3af", paddingTop: 40, fontSize: 14 }}
            />
          }
        />
      )}
    </View>
  );
}

export function FanclubCreatorScreen({ creatorId }: { creatorId: number }) {
  const router = useRouter();
  const [info, setInfo] = useState<FanclubCreatorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const showCreatorRestrictionAlert = useCallback(
    (detailObj: CreatorRestrictionDetail) => {
      const baseMessage = detailObj?.message || "情報取得に失敗しました";
      const progressText = formatRankProgressLabelForAlert(detailObj?.rankProgress);
      Alert.alert(
        "ファンクラブ未開設",
        progressText ? `${baseMessage}\n\n次ランク条件: ${progressText}` : baseMessage,
        [
          { text: "閉じる", style: "cancel" },
          {
            text: "プロフィールを見る",
            onPress: () => {
              const targetUserId = detailObj?.creatorId || creatorId;
              router.push({ pathname: "/user/[id]", params: { id: String(targetUserId) } });
            },
          },
        ],
      );
    },
    [creatorId, router],
  );

  const fetchInfo = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<FanclubCreatorInfo>(`/fanclub/creator/${creatorId}`);
      setInfo(response.data);
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      if (
        error?.response?.status === 403 &&
        detail &&
        typeof detail === "object" &&
        typeof detail.message === "string"
      ) {
        showCreatorRestrictionAlert(detail as CreatorRestrictionDetail);
      } else {
        Alert.alert("エラー", detail || "情報取得に失敗しました");
      }
      setInfo(null);
    } finally {
      setLoading(false);
    }
  }, [creatorId, showCreatorRestrictionAlert]);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  const handleSubscribe = async () => {
    try {
      setProcessing(true);
      await apiClient.post<FanclubSubscribeResponse>(`/fanclub/subscribe/${creatorId}`, {});
      await fetchInfo();
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      if (
        error?.response?.status === 403 &&
        detail &&
        typeof detail === "object" &&
        typeof detail.message === "string"
      ) {
        showCreatorRestrictionAlert(detail as CreatorRestrictionDetail);
      } else {
        Alert.alert("エラー", detail || "加入に失敗しました");
      }
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <LoadingState
        color="#7c3aed"
        containerStyle={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      />
    );
  }

  if (!info) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
        <View
          style={{
            borderBottomWidth: 1,
            borderColor: "#f3f4f6",
            backgroundColor: "#ffffff",
            paddingHorizontal: 16,
            paddingTop: 20,
          }}
        >
          <ScreenBackButton
            onPress={() => router.back()}
            style={{ paddingBottom: 10 }}
            textStyle={{ color: "#6b7280", fontSize: 15 }}
          />
          <Text style={{ marginBottom: 4, fontWeight: "700", color: "#111827" }}>
            💜 ファンクラブ
          </Text>
        </View>
        <EmptyState
          message="ファンクラブ情報が見つかりません"
          textStyle={{ textAlign: "center", color: "#9ca3af", paddingTop: 40, fontSize: 14 }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <View
        style={{
          borderBottomWidth: 1,
          borderColor: "#f3f4f6",
          backgroundColor: "#ffffff",
          paddingHorizontal: 16,
          paddingTop: 20,
        }}
      >
        <ScreenBackButton
          onPress={() => router.back()}
          style={{ paddingBottom: 10 }}
          textStyle={{ color: "#6b7280", fontSize: 15 }}
        />
        <Text style={{ marginBottom: 4, fontWeight: "700", color: "#111827" }}>
          💜 ファンクラブ
        </Text>
        <Text style={{ color: "#6b7280" }}>クリエーターを継続支援できます</Text>
      </View>

      <View
        style={{
          margin: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          backgroundColor: "#ffffff",
          padding: 16,
        }}
      >
        <Text style={{ marginBottom: 8, fontSize: 18, fontWeight: "700", color: "#111827" }}>
          {info.creator_name}
        </Text>
        <Text style={{ marginBottom: 4, fontSize: 14, color: "#6b7280" }}>
          メンバー数: {info.member_count}人
        </Text>
        <Text style={{ fontSize: 14, color: "#374151" }}>
          月額: ¥{info.monthly_price_jpy.toLocaleString()}
        </Text>

        {info.is_subscribed ? (
          <View
            style={{
              alignItems: "center",
              borderRadius: 8,
              backgroundColor: "#ede9fe",
              paddingVertical: 10,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#6d28d9" }}>加入中</Text>
          </View>
        ) : (
          <ActionButton
            label={processing ? "処理中..." : "このファンクラブに加入する"}
            disabled={processing}
            onPress={handleSubscribe}
            style={{
              backgroundColor: "#7c3aed",
              borderRadius: 8,
              paddingVertical: 12,
              alignItems: "center",
            }}
            textStyle={{ color: "#ffffff", fontSize: 15, fontWeight: "700" }}
          />
        )}
      </View>
    </View>
  );
}
