import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  PanResponder,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { EmptyState } from "../../components/common/EmptyState";
import { LoadingState } from "../../components/common/LoadingState";
import apiClient from "../../services/api";
import { LikeActionResponse, PassActionResponse } from "../../types/match";
import { formatRankProgressLabel } from "../../utils/rankProgress";
import { UserCard } from "../../types/user";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_OUT_DURATION = 250;

const cardBaseStyle = {
  position: "absolute" as const,
  width: "100%" as const,
  borderRadius: 16,
  padding: 24,
  backgroundColor: "#fff",
  shadowColor: "#000",
  shadowOpacity: 0.15,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 6,
};

export function TimelineScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isAnimatingRef = useRef(false);
  const position = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    position.setValue({ x: 0, y: 0 });
    isAnimatingRef.current = false;
  }, [currentIndex, position]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<UserCard[]>("/users/recommendations");
      setUsers(response.data);
      setCurrentIndex(0);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getRequestStatusLabel = (status?: string): string | null => {
    if (status === "pending") return "依頼中";
    if (status === "matched") return "マッチ済み";
    if (status === "passed") return "以前にパス";
    return null;
  };

  const isLikeBlocked = (status?: string): boolean => {
    return status === "pending" || status === "matched";
  };

  const submitAction = async (action: "like" | "pass", targetUserId: number) => {
    try {
      if (action === "like") {
        const response = await apiClient.post<LikeActionResponse>("/matches/like", {
          target_user_id: targetUserId,
        });
        if (response.data?.status === "matched") {
          Alert.alert("マッチ成立", response.data?.message || "お互いにいいねしました！");
        } else if (response.data?.status === "already_pending") {
          Alert.alert(
            "依頼中",
            response.data?.message || "このユーザーには既にいいねを送信済みです",
          );
        } else if (response.data?.status === "already_matched") {
          Alert.alert(
            "マッチ済み",
            response.data?.message || "このユーザーとは既にマッチしています",
          );
        } else if (response.data?.status === "blocked_by_filter") {
          const detail = response.data;
          const progressText = formatRankProgressLabel(detail.rankProgress);
          const message = detail.message || "相手の受信フィルターにより、いいねを送れませんでした";
          Alert.alert(
            "送信不可",
            progressText
              ? `${message}\n\n次ランク条件: ${progressText}`
              : `${message}${
                  detail.requiredRank && detail.senderRank
                    ? `\n現在ランク: Rank${detail.senderRank} / 必要ランク: Rank${detail.requiredRank}`
                    : ""
                }`,
            [
              { text: "閉じる", style: "cancel" },
              {
                text: "次ランク条件を見る",
                onPress: () => router.push("/(tabs)/profile?focus=rank"),
              },
            ],
          );
        }
      } else {
        await apiClient.post<PassActionResponse>("/matches/pass", { target_user_id: targetUserId });
      }
    } catch (error) {
      console.error("Failed to submit action:", error);
    } finally {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const resetPosition = () => {
    Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
  };

  const swipeCard = (action: "like" | "pass", dy = 0) => {
    if (isAnimatingRef.current) return;
    const targetUser = users[currentIndex];
    const targetUserId = targetUser?.id;
    if (!targetUserId) return;

    if (action === "like" && isLikeBlocked(targetUser?.requestStatus)) {
      Alert.alert(
        "Like不可",
        targetUser?.requestStatus === "pending"
          ? "このユーザーには既に依頼中です"
          : "このユーザーとは既にマッチ済みです",
      );
      resetPosition();
      return;
    }

    isAnimatingRef.current = true;
    Animated.timing(position, {
      toValue: { x: action === "like" ? SCREEN_WIDTH : -SCREEN_WIDTH, y: dy },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      submitAction(action, targetUserId);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: position.x, dy: position.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_event, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeCard("like", gesture.dy);
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeCard("pass", gesture.dy);
        } else {
          resetPosition();
        }
      },
    }),
  ).current;

  if (loading) return <LoadingState color="#e74c3c" />;

  if (currentIndex >= users.length) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 32,
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
        }}
      >
        <EmptyState
          message="ユーザーがいません"
          containerStyle={{ paddingVertical: 0 }}
          textStyle={{ fontSize: 18, color: "#fff" }}
        />
        <TouchableOpacity
          style={{
            backgroundColor: "#e74c3c",
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 24,
            alignSelf: "center",
          }}
          onPress={fetchUsers}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>リロード</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentUser = users[currentIndex];
  const nextUser = users[currentIndex + 1];
  const currentRelationLabel = getRequestStatusLabel(currentUser.requestStatus);
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ["-12deg", "0deg", "12deg"],
  });
  const animatedCardStyle = { transform: [...position.getTranslateTransform(), { rotate }] };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#000",
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 32,
        justifyContent: "center",
      }}
    >
      <View style={{ flex: 1, justifyContent: "center" }}>
        <View style={{ position: "relative", justifyContent: "center", height: 320 }}>
          {nextUser && (
            <View style={[cardBaseStyle, { transform: [{ scale: 0.96 }], opacity: 0.7 }]}>
              <Text
                style={{ fontSize: 22, fontWeight: "bold", marginBottom: 12, color: "#111827" }}
              >
                {nextUser.displayName}
                {nextUser.age ? `, ${nextUser.age}` : ""}
              </Text>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#374151", marginBottom: 6 }}>
                ⭐ {Number(nextUser.reviewAvg || 0).toFixed(2)} / Rank {nextUser.rank || 1}
              </Text>
              <Text style={{ fontSize: 16, color: "#6b7280" }}>{nextUser.bio || ""}</Text>
            </View>
          )}
          <Animated.View style={[cardBaseStyle, animatedCardStyle]} {...panResponder.panHandlers}>
            {currentUser.isRecommended && (
              <View style={{ backgroundColor: "#1e40af", alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, marginBottom: 8 }}>
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>おすすめ✨</Text>
              </View>
            )}
            <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 12, color: "#111827" }}>
              {currentUser.displayName}
              {currentUser.age ? `, ${currentUser.age}` : ""}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#374151", marginBottom: 6 }}>
              ⭐ {Number(currentUser.reviewAvg || 0).toFixed(2)} / Rank {currentUser.rank || 1}
            </Text>
            {currentRelationLabel && (
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "bold",
                  marginBottom: 6,
                  color:
                    currentUser.requestStatus === "pending"
                      ? "#92400e"
                      : currentUser.requestStatus === "matched"
                        ? "#166534"
                        : "#6b7280",
                }}
              >
                {currentRelationLabel}
              </Text>
            )}
            <Text style={{ fontSize: 16, color: "#6b7280" }}>{currentUser.bio || ""}</Text>
          </Animated.View>
        </View>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "center", gap: 24, marginTop: 12 }}>
        <TouchableOpacity
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#3a3a3a",
          }}
          onPress={() => swipeCard("pass")}
        >
          <Text style={{ fontSize: 22, color: "#fff" }}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: isLikeBlocked(currentUser.requestStatus) ? "#9ca3af" : "#e74c3c",
          }}
          onPress={() => swipeCard("like")}
          disabled={isLikeBlocked(currentUser.requestStatus)}
        >
          <Text style={{ fontSize: 22, color: "#fff" }}>♥</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
