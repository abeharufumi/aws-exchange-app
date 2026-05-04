import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActionButton } from "../../components/common/ActionButton";
import { ActionButtonRow } from "../../components/common/ActionButtonRow";
import { AvatarWithFrame } from "../../components/common/AvatarWithFrame";
import { ReceiveFilterToggle } from "../../components/common/ReceiveFilterToggle";
import apiClient from "../../services/api";
import { useAuth } from "../../contexts/auth";
import { ActiveBoostResponse } from "../../types/boost";
import { PremiumCancelResponse, PremiumStatusResponse } from "../../types/premium";
import {
  ProfileUpdateResponse,
  ReceiveFilter,
  RankProgressItem,
  UserProfile,
} from "../../types/profile";
import { FootprintItem } from "../../types/user";

export function ProfileScreen() {
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const router = useRouter();
  const scrollRef = useRef<ScrollView | null>(null);
  const [rankGuideY, setRankGuideY] = useState(0);
  const { logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [footprints, setFootprints] = useState<FootprintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showFootprints, setShowFootprints] = useState(false);
  const [updatingReceiveFilter, setUpdatingReceiveFilter] = useState(false);
  const [cancellingPremium, setCancellingPremium] = useState(false);
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatusResponse | null>(null);
  const [activeBoost, setActiveBoost] = useState<ActiveBoostResponse | null>(null);
  const [receiveFilter, setReceiveFilter] = useState<ReceiveFilter>({
    blockRank1: false,
    blockRank2: false,
    blockRank3: false,
    tributeFilterEnabled: false,
  });
  const [form, setForm] = useState({
    displayName: "",
    age: "",
    location: "",
    bio: "",
  });

  const fetchFootprints = useCallback(async () => {
    try {
      const response = await apiClient.get<FootprintItem[]>("/users/footprints/my-footprints");
      setFootprints(response.data || []);
    } catch (error) {
      console.error("Failed to fetch footprints:", error);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const [response, premiumResponse, boostResponse] = await Promise.all([
        apiClient.get<UserProfile>("/users/me"),
        apiClient
          .get<PremiumStatusResponse | null>("/premium/status")
          .catch(() => ({ data: null })),
        apiClient.get<ActiveBoostResponse | null>("/boost/active").catch(() => ({ data: null })),
      ]);
      setProfile(response.data);
      setPremiumStatus(premiumResponse?.data || null);
      setActiveBoost(boostResponse?.data || null);
      setReceiveFilter(
        response.data?.receiveFilter || {
          blockRank1: false,
          blockRank2: false,
          blockRank3: false,
          tributeFilterEnabled: false,
        },
      );
      setForm({
        displayName: response.data.displayName || "",
        age: response.data.age ? String(response.data.age) : "",
        location: response.data.location || "",
        bio: response.data.bio || "",
      });

      if (response.data?.canViewFootprints) {
        fetchFootprints();
      } else {
        setFootprints([]);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchFootprints]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (loading || focus !== "rank") {
      return;
    }
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(rankGuideY - 12, 0), animated: true });
    }, 80);
    return () => clearTimeout(timer);
  }, [focus, loading, rankGuideY]);

  const updateReceiveFilter = async (nextFilter: ReceiveFilter) => {
    if (updatingReceiveFilter) {
      return;
    }
    try {
      setUpdatingReceiveFilter(true);
      const response = await apiClient.put<ReceiveFilter>("/users/receive-filter", nextFilter);
      setReceiveFilter(response.data || nextFilter);
    } catch (error) {
      console.error("Failed to update receive filter:", error);
      Alert.alert("更新エラー", "受信フィルターの更新に失敗しました");
    } finally {
      setUpdatingReceiveFilter(false);
    }
  };

  const handleToggleReceiveFilter = (key: keyof ReceiveFilter) => {
    const nextFilter: ReceiveFilter = {
      ...receiveFilter,
      [key]: !receiveFilter[key],
    };
    setReceiveFilter(nextFilter);
    updateReceiveFilter(nextFilter);
  };

  const handleShareRank = async () => {
    if (!profile) return;
    const rankLabel = ["新参者", "認証済み", "常連", "エリート", "神"][
      Math.max(0, (profile.rank ?? 1) - 1)
    ];
    const message =
      `\u3010AWS Exchange\u3011\n` +
      `\u79c1\u306e\u73fe\u5728\u306e\u30e9\u30f3\u30af\u306f\u300eRank ${profile.rank ?? 1}\uff1a${rankLabel}\u300f\u3067\u3059\ud83d\udc51\n` +
      `\u4f1a\u3063\u305f\u56de\u6570: ${profile.meetsCount ?? 0}\u56de | \u30ec\u30d3\u30e5\u30fc\u5e73\u5747: ${profile.reviewAvg ?? "\u2015"}\n` +
      `#ESNS #\u5e02\u5834\u4fa1\u5024\u8a3a\u65ad`;
    try {
      await Share.share({ message });
    } catch {
      Alert.alert(
        "\u30a8\u30e9\u30fc",
        "\u30b7\u30a7\u30a2\u306b\u5931\u6557\u3057\u307e\u3057\u305f",
      );
    }
  };

  const handleLogout = async () => {
    Alert.alert("ログアウト", "本当にログアウトしますか？", [
      { text: "キャンセル" },
      {
        text: "ログアウト",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!profile) return;

    const payload: Record<string, string | number | null> = {};
    const trimmedName = form.displayName.trim();
    const trimmedLocation = form.location.trim();
    const trimmedBio = form.bio.trim();

    if (trimmedName && trimmedName !== profile.displayName) {
      payload.displayName = trimmedName;
    }
    if (form.age !== (profile.age ? String(profile.age) : "")) {
      payload.age = form.age ? Number(form.age) : null;
    }
    if (trimmedLocation !== (profile.location || "")) {
      payload.location = trimmedLocation || null;
    }
    if (trimmedBio !== (profile.bio || "")) {
      payload.bio = trimmedBio || null;
    }

    if (Object.keys(payload).length === 0) {
      setIsEditing(false);
      return;
    }

    try {
      await apiClient.patch<ProfileUpdateResponse>("/users/me", payload);
      await fetchProfile();
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
      Alert.alert("更新エラー", "プロフィールの更新に失敗しました");
    }
  };

  const handleCancel = () => {
    if (!profile) return;
    setForm({
      displayName: profile.displayName || "",
      age: profile.age ? String(profile.age) : "",
      location: profile.location || "",
      bio: profile.bio || "",
    });
    setIsEditing(false);
  };

  const handleCancelPremium = () => {
    if (!premiumStatus || premiumStatus.status !== "active" || cancellingPremium) {
      return;
    }
    Alert.alert("Premium解約", "Premiumを解約しますか？（有効期限までは利用できます）", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "解約する",
        style: "destructive",
        onPress: async () => {
          try {
            setCancellingPremium(true);
            const response = await apiClient.post<PremiumCancelResponse>("/premium/cancel");
            Alert.alert("完了", response.data?.message || "Premiumを解約しました");
            await fetchProfile();
          } catch (error: any) {
            Alert.alert("エラー", error?.response?.data?.detail || "Premium解約に失敗しました");
          } finally {
            setCancellingPremium(false);
          }
        },
      },
    ]);
  };

  const rankProgress = profile?.rankProgress;
  const rankProgressItems: RankProgressItem[] = rankProgress?.items || [];
  const calcRemainingDays = (value?: string | null): number | null => {
    if (!value) {
      return null;
    }
    const end = new Date(value).getTime();
    if (!Number.isFinite(end)) {
      return null;
    }
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) {
      return 0;
    }
    return Math.ceil(diff / (24 * 60 * 60 * 1000));
  };

  const premiumRemainingDays = calcRemainingDays(premiumStatus?.ends_at);
  const boostRemainingDays = calcRemainingDays(activeBoost?.expires_at);
  const isPremiumActive = premiumStatus?.status === "active";
  const isPremiumCancelled = premiumStatus?.status === "cancelled";
  const premiumStateLabel = isPremiumActive ? "有効" : isPremiumCancelled ? "解約予定" : "未加入";
  const premiumEndsAt = premiumStatus?.ends_at
    ? new Date(premiumStatus.ends_at).toLocaleDateString("ja-JP")
    : null;
  const boostEndsAt = activeBoost?.expires_at
    ? new Date(activeBoost.expires_at).toLocaleDateString("ja-JP")
    : null;

  const formatRankProgressLabel = (item: RankProgressItem): string => {
    const unit = item.unit || "";
    return `${item.label} ${item.currentValue}${unit}/${item.requiredValue}${unit}`;
  };

  const primaryButtonStyle = {
    backgroundColor: "#e74c3c",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center" as const,
    flex: 1,
  };
  const secondaryButtonStyle = {
    backgroundColor: "#3a3a3a",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center" as const,
    flex: 1,
  };
  const neutralButtonStyle = {
    backgroundColor: "#999",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center" as const,
  };
  const buttonTextStyle = {
    color: "white",
    fontSize: 16,
    fontWeight: "bold" as const,
  };
  const inputStyle = {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: "#fff",
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1, backgroundColor: "#ffffff", paddingHorizontal: 20 }}
    >
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#e74c3c" />
        </View>
      ) : profile ? (
        <>
          <View
            style={{
              borderBottomWidth: 1,
              borderColor: "#e5e7eb",
              paddingBottom: 20,
              paddingTop: 20,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <AvatarWithFrame
                avatarUrl={profile.avatarUrl}
                iconFrameImageUrl={profile.iconFrameImageUrl}
                size={80}
                initials={profile.displayName?.[0]}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ marginBottom: 4, fontSize: 24, fontWeight: "700", color: "#111827" }}>
                  {profile.displayName}
                </Text>
                <Text style={{ fontSize: 14, color: "#6b7280" }}>
                  {profile.age ? `${profile.age}歳` : "年齢未設定"} •
                  {profile.gender === "male" ? "男性" : "女性"}
                </Text>
              </View>
            </View>
            <Text style={{ marginBottom: 4, fontSize: 16, color: "#6b7280" }}>
              ⭐ レビュー平均: {Number(profile.reviewAvg || 0).toFixed(2)}
            </Text>
            <Text style={{ marginBottom: 4, fontSize: 16, color: "#6b7280" }}>
              🤝 会った回数: {profile.meetsCount || 0}
            </Text>
            <Text style={{ marginBottom: 4, fontSize: 16, color: "#6b7280" }}>
              💬 返信率: {Number(profile.replyRate || 0).toFixed(1)}%
            </Text>
            <Text style={{ marginBottom: 4, fontSize: 16, color: "#6b7280" }}>
              🛡️ マナー点: {profile.mannerPoints || 0}
            </Text>
            <Text style={{ marginBottom: 4, fontSize: 16, color: "#6b7280" }}>
              🏅 ランク: {profile.rank || 1}
            </Text>
            <Text style={{ marginBottom: 4, fontSize: 16, color: "#6b7280" }}>
              📧 {profile.email}
            </Text>
            <Text style={{ marginBottom: 4, fontSize: 16, color: "#6b7280" }}>
              📱 {profile.phoneNumber || "未設定"}
            </Text>
          </View>

          <View
            onLayout={(event) => setRankGuideY(event.nativeEvent.layout.y)}
            style={{
              marginTop: 4,
              marginBottom: 12,
              backgroundColor: "#f8fafc",
              borderRadius: 10,
              paddingVertical: 14,
              paddingHorizontal: 14,
              borderWidth: 1,
              borderColor: "#e2e8f0",
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#1f2937", marginBottom: 4 }}>
              次ランク条件
            </Text>
            {rankProgress && !rankProgress.isMaxRank ? (
              <>
                <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>
                  Rank{rankProgress.nextRank} までの進捗
                </Text>
                {rankProgressItems.map((item) => (
                  <View
                    key={item.key}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 8,
                      borderTopWidth: 1,
                      borderTopColor: "#edf2f7",
                    }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 13,
                        color: "#374151",
                        fontWeight: "600",
                        marginRight: 8,
                      }}
                    >
                      {formatRankProgressLabel(item)}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: item.done ? "#059669" : "#dc2626",
                        fontWeight: "700",
                      }}
                    >
                      {item.done ? "達成" : "未達成"}
                    </Text>
                  </View>
                ))}
              </>
            ) : (
              <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>
                最高ランクに到達しています
              </Text>
            )}
          </View>

          <View
            style={{
              marginBottom: 12,
              marginTop: 20,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              backgroundColor: "#f9fafb",
              paddingVertical: 14,
            }}
          >
            <Text style={{ marginBottom: 4, fontSize: 16, fontWeight: "700", color: "#1f2937" }}>
              受信フィルター
            </Text>
            <Text style={{ marginBottom: 12, fontSize: 12, color: "#6b7280" }}>
              指定ランクからの「いいね受信」を制限できます
            </Text>

            <ReceiveFilterToggle
              label="Rank1 をブロック"
              value={receiveFilter.blockRank1}
              disabled={updatingReceiveFilter}
              onPress={() => handleToggleReceiveFilter("blockRank1")}
            />

            <ReceiveFilterToggle
              label="Rank2 をブロック"
              value={receiveFilter.blockRank2}
              disabled={updatingReceiveFilter}
              onPress={() => handleToggleReceiveFilter("blockRank2")}
            />

            <ReceiveFilterToggle
              label="Rank3 をブロック"
              value={receiveFilter.blockRank3}
              disabled={updatingReceiveFilter}
              onPress={() => handleToggleReceiveFilter("blockRank3")}
            />
          </View>

          <View
            style={{
              marginBottom: 12,
              marginTop: 8,
              borderRadius: 12,
              borderWidth: 1,
              paddingVertical: 14,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#1f2937" }}>
              会員・ブースト状態
            </Text>
            <View
              style={{
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                backgroundColor: "#ffffff",
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#6b7280" }}>Premium</Text>
                {isPremiumActive ? (
                  <TouchableOpacity
                    style={{
                      backgroundColor: "#fee2e2",
                      borderRadius: 999,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                    }}
                    onPress={handleCancelPremium}
                    disabled={cancellingPremium}
                  >
                    <Text
                      style={{
                        color: "#b91c1c",
                        fontSize: 12,
                        fontWeight: "700",
                      }}
                    >
                      {cancellingPremium ? "処理中..." : "解約"}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <Text style={{ marginTop: 4, fontSize: 14, fontWeight: "700", color: "#1f2937" }}>
                {premiumStateLabel}
              </Text>
              <Text style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>
                {premiumEndsAt
                  ? `有効期限: ${premiumEndsAt}${premiumRemainingDays !== null ? `（残り${premiumRemainingDays}日）` : ""}`
                  : "加入するとメッセージ送信が無制限になります"}
              </Text>
            </View>
            <View
              style={{
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                backgroundColor: "#ffffff",
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#6b7280" }}>Boost</Text>
              <Text style={{ marginTop: 4, fontSize: 14, fontWeight: "700", color: "#1f2937" }}>
                {activeBoost ? "有効" : "未有効"}
              </Text>
              <Text style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>
                {boostEndsAt
                  ? `有効期限: ${boostEndsAt}${boostRemainingDays !== null ? `（残り${boostRemainingDays}日）` : ""}`
                  : "有効化するとチャット送信上限が増加します"}
              </Text>
            </View>
          </View>

          {isEditing && (
            <View style={{ marginBottom: 20, gap: 12 }}>
              <View>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#333", marginBottom: 4 }}>
                  表示名
                </Text>
                <TextInput
                  style={inputStyle}
                  value={form.displayName}
                  onChangeText={(text) => setForm((prev) => ({ ...prev, displayName: text }))}
                />
              </View>
              <View>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#333", marginBottom: 4 }}>
                  年齢
                </Text>
                <TextInput
                  style={inputStyle}
                  value={form.age}
                  onChangeText={(text) => setForm((prev) => ({ ...prev, age: text }))}
                  keyboardType="number-pad"
                />
              </View>
              <View>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#333", marginBottom: 4 }}>
                  居住地
                </Text>
                <TextInput
                  style={inputStyle}
                  value={form.location}
                  onChangeText={(text) => setForm((prev) => ({ ...prev, location: text }))}
                />
              </View>
              <View>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#333", marginBottom: 4 }}>
                  自己紹介
                </Text>
                <TextInput
                  style={inputStyle}
                  value={form.bio}
                  onChangeText={(text) => setForm((prev) => ({ ...prev, bio: text }))}
                  multiline
                />
              </View>
            </View>
          )}

          {isEditing ? (
            <ActionButtonRow style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
              <ActionButton
                label="キャンセル"
                variant="secondary"
                onPress={handleCancel}
                style={secondaryButtonStyle}
                textStyle={buttonTextStyle}
              />
              <ActionButton
                label="保存"
                onPress={handleSave}
                style={primaryButtonStyle}
                textStyle={buttonTextStyle}
              />
            </ActionButtonRow>
          ) : (
            <ActionButton
              label="プロフィール編集"
              onPress={() => setIsEditing(true)}
              style={{ ...primaryButtonStyle, marginBottom: 10 }}
              textStyle={buttonTextStyle}
            />
          )}

          <ActionButtonRow style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
            <TouchableOpacity
              style={secondaryButtonStyle}
              onPress={() => router.push("/boost-purchase")}
            >
              <Text style={buttonTextStyle}>{activeBoost ? "Boost延長購入" : "Boost購入"}</Text>
            </TouchableOpacity>
            <ActionButton
              label={premiumStatus ? "Premium利用中" : "Premium加入"}
              variant="secondary"
              onPress={() => {
                if (premiumStatus) {
                  return;
                }
                router.push("/premium-subscribe");
              }}
              disabled={Boolean(premiumStatus)}
              style={secondaryButtonStyle}
              textStyle={buttonTextStyle}
            />
          </ActionButtonRow>

          <ActionButton
            label="🖼️ アイコンフレームショップ"
            variant="secondary"
            onPress={() => router.push("/icon-frame-shop")}
            style={{ ...secondaryButtonStyle, marginTop: 10, marginBottom: 10 }}
            textStyle={buttonTextStyle}
          />

          <ActionButtonRow style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
            <ActionButton
              label="🔴 ライブ配信"
              variant="secondary"
              onPress={() => router.push("/live")}
              style={secondaryButtonStyle}
              textStyle={buttonTextStyle}
            />
            <ActionButton
              label="💜 ファンクラブ"
              variant="secondary"
              onPress={() => router.push("/fanclub")}
              style={secondaryButtonStyle}
              textStyle={buttonTextStyle}
            />
          </ActionButtonRow>

          <ActionButtonRow style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
            <ActionButton
              label="📞 通話チケット"
              variant="secondary"
              onPress={() => router.push("/call-tickets")}
              style={secondaryButtonStyle}
              textStyle={buttonTextStyle}
            />
            <ActionButton
              label="🎁 ギフト"
              variant="secondary"
              onPress={() => router.push("/gifts")}
              style={secondaryButtonStyle}
              textStyle={buttonTextStyle}
            />
          </ActionButtonRow>

          <ActionButton
            label="足跡履歴を見る"
            variant="secondary"
            onPress={() => router.push("/footprint")}
            style={{ ...secondaryButtonStyle, marginTop: 10, marginBottom: 10 }}
            textStyle={buttonTextStyle}
          />

          <TouchableOpacity
            style={{
              marginTop: 20,
              marginBottom: 12,
              paddingVertical: 12,
              paddingHorizontal: 12,
              backgroundColor: "#f5f5f5",
              borderRadius: 8,
              borderLeftWidth: 4,
              borderLeftColor: "#e74c3c",
            }}
            onPress={() => {
              if (!profile.canViewFootprints) {
                Alert.alert("足あと閲覧", "足あと閲覧はRank3以上で解放されます");
                return;
              }
              setShowFootprints(!showFootprints);
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#333" }}>
              👣 足跡
              {profile.canViewFootprints
                ? `（直近${profile.footprintViewLimit || 3}人） ${showFootprints ? "▼" : "▶"}`
                : "（Rank3で解放）"}
            </Text>
          </TouchableOpacity>

          {!profile.canViewFootprints && (
            <View
              style={{
                marginBottom: 20,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                backgroundColor: "#f9fafb",
                paddingVertical: 16,
              }}
            >
              <Text
                style={{
                  marginBottom: 4,
                  textAlign: "center",
                  fontSize: 14,
                  fontWeight: "700",
                  color: "#374151",
                }}
              >
                足あと閲覧は Rank3 以上で解放されます
              </Text>
              <Text style={{ textAlign: "center", fontSize: 12, color: "#6b7280" }}>
                解放後は直近{profile.footprintViewLimit || 3}人まで確認できます
              </Text>
            </View>
          )}

          {profile.canViewFootprints && showFootprints && (
            <View
              style={{
                marginBottom: 20,
                borderRadius: 8,
                backgroundColor: "#f9fafb",
                paddingVertical: 8,
              }}
            >
              {footprints.length > 0 ? (
                <FlatList
                  data={footprints}
                  scrollEnabled={false}
                  keyExtractor={(item) => item.visitorId.toString()}
                  renderItem={({ item }) => {
                    const viewedDate = new Date(item.viewedAt).toLocaleString("ja-JP", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          borderBottomWidth: 1,
                          borderColor: "#e5e7eb",
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                        }}
                      >
                        <Text
                          style={{ flex: 1, fontSize: 14, fontWeight: "600", color: "#374151" }}
                        >
                          {item.visitorName}
                        </Text>
                        <Text style={{ fontSize: 12, color: "#9ca3af" }}>{viewedDate}</Text>
                      </View>
                    );
                  }}
                />
              ) : (
                <Text
                  style={{
                    paddingVertical: 20,
                    textAlign: "center",
                    fontSize: 14,
                    color: "#9ca3af",
                  }}
                >
                  足跡はありません
                </Text>
              )}
            </View>
          )}

          <ActionButton
            label="📣 ランクをシェア"
            variant="secondary"
            onPress={handleShareRank}
            style={{ ...secondaryButtonStyle, marginBottom: 10 }}
            textStyle={buttonTextStyle}
          />

          <ActionButton
            label="ログアウト"
            variant="neutral"
            onPress={handleLogout}
            style={{ ...neutralButtonStyle, marginBottom: 20 }}
            textStyle={buttonTextStyle}
          />
        </>
      ) : (
        <Text style={{ paddingVertical: 20, fontSize: 16, color: "#6b7280" }}>
          プロフィールが見つかりません
        </Text>
      )}
    </ScrollView>
  );
}
