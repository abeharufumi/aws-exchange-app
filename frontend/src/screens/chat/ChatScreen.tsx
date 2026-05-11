import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  type ViewToken,
  View,
  AppState,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Button, TextInput as PaperTextInput } from "react-native-paper";
import { ScreenBackButton } from "../../components/common/ScreenBackButton";
import { StatusInfoBox } from "../../components/common/StatusInfoBox";
import { DatePickerModal } from "../../components/common/DatePickerModal";
import { TimePickerModal } from "../../components/common/TimePickerModal";
import apiClient, { isUnauthorizedError } from "../../services/api";
import { useAuth } from "../../contexts/auth";
import {
  ChatMessage,
  ChatMessageResponse,
  ChatQuotaResponse,
  ChatReadResponse,
  ChatSendMessageResponse,
} from "../../types/chat";
import {
  MeetBetweenUsersResponse,
  MeetDecisionResponse,
  MeetRequestResponse,
  MeetReviewStatusResponse,
} from "../../types/meet";
import { RankProgress } from "../../types/profile";
import { PublicUserProfile } from "../../types/user";

type MeetSpot = {
  key: string;
  label: string;
  latitude: number;
  longitude: number;
};

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

type QuotaLimitErrorDetail = {
  message?: string;
  currentRank?: number;
  dailyLimit?: number;
  rankProgress?: RankProgress;
};

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatLocalTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

async function searchNominatim(query: string): Promise<NominatimResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    addressdetails: "0",
    limit: "6",
    "accept-language": "ja",
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { "User-Agent": "aws-exchange-app/1.0" },
  });
  if (!res.ok) {
    throw new Error("nominatim_error");
  }
  return res.json();
}

const MEET_SPOTS: MeetSpot[] = [
  { key: "hakata", label: "博多駅", latitude: 33.589886, longitude: 130.420685 },
  { key: "tokyo", label: "東京駅", latitude: 35.681236, longitude: 139.767125 },
  { key: "shibuya", label: "渋谷駅", latitude: 35.658034, longitude: 139.701636 },
  { key: "shinjuku", label: "新宿駅", latitude: 35.690921, longitude: 139.700258 },
];

export function ChatScreen({ route }: any) {
  const router = useRouter();
  const { user } = useAuth();
  const { id, snackbar } = route.params;
  const chatUserId = useMemo(() => Number(id), [id]);
  const [partnerName, setPartnerName] = useState("チャット");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [meetModalVisible, setMeetModalVisible] = useState(false);
  const [meetDate, setMeetDate] = useState("");
  const [meetTime, setMeetTime] = useState("");
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [selectedMeetSpotKey, setSelectedMeetSpotKey] = useState("hakata");
  const [customMeetCoordinates, setCustomMeetCoordinates] = useState<{
    latitude: number;
    longitude: number;
    label: string;
  } | null>(null);
  const [placeSearchVisible, setPlaceSearchVisible] = useState(false);
  const [placeSearchQuery, setPlaceSearchQuery] = useState("");
  const [placeSearchResults, setPlaceSearchResults] = useState<NominatimResult[]>([]);
  const [placeSearching, setPlaceSearching] = useState(false);
  const [meetRequestStatus, setMeetRequestStatus] = useState<
    "none" | "pending" | "accepted" | "rejected" | "completed" | "cancelled" | "reported"
  >("none");
  const [meetRequestRole, setMeetRequestRole] = useState<"none" | "sender" | "receiver">("none");
  const [meetRequestId, setMeetRequestId] = useState<number | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [meetScheduledDate, setMeetScheduledDate] = useState<string | null>(null);
  const [meetScheduledTime, setMeetScheduledTime] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState<number>(Date.now());
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [messageQuota, setMessageQuota] = useState<ChatQuotaResponse | null>(null);
  const [stopPolling, setStopPolling] = useState(false);
  const requestedReadIdsRef = useRef<Set<number>>(new Set());
  const messageListRef = useRef<FlatList<ChatMessage> | null>(null);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 });
  const statusInfoContainerStyle = {
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    padding: 10,
  } as const;
  const statusInfoTextStyle = {
    color: "#374151",
    fontSize: 13,
    textAlign: "center",
    fontWeight: "600",
  } as const;

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)");
  };

  const fetchPartnerProfile = useCallback(async () => {
    try {
      if (!Number.isFinite(chatUserId)) {
        return;
      }
      const response = await apiClient.get<PublicUserProfile>(`/users/${chatUserId}`);
      const displayName = response.data?.displayName;
      if (displayName) {
        setPartnerName(displayName);
      }
    } catch (error) {
      if ((error as Error)?.message === "AUTH_TOKEN_MISSING" || isUnauthorizedError(error)) {
        setStopPolling(true);
        return;
      }
      console.error("Failed to fetch partner profile:", error);
    }
  }, [chatUserId]);

  const fetchMessages = useCallback(async () => {
    try {
      if (!Number.isFinite(chatUserId)) {
        return;
      }
      const response = await apiClient.get<ChatMessageResponse[]>(`/chat/${chatUserId}/messages`);
      const mapped: ChatMessage[] = response.data.map((item) => ({
        id: item.id,
        senderId: item.sender_id,
        message: item.message,
        sentAt: item.sent_at,
        isRead: item.is_read,
        isSender: user ? item.sender_id === user.id : false,
      }));
      setMessages(mapped);
    } catch (error) {
      if ((error as Error)?.message === "AUTH_TOKEN_MISSING" || isUnauthorizedError(error)) {
        setStopPolling(true);
        return;
      }
      console.error("Failed to fetch messages:", error);
    }
  }, [chatUserId, user]);

  const formatRankProgressLabel = useCallback((progress: RankProgress): string | null => {
    const pendingItem = progress.items.find((item) => !item.done);
    const displayItem = pendingItem || progress.items[0];
    if (!displayItem) {
      return null;
    }
    const unit = displayItem.unit || "";
    return `${displayItem.label} ${displayItem.currentValue}${unit}/${displayItem.requiredValue}${unit}`;
  }, []);

  const fetchMessageQuota = useCallback(async () => {
    try {
      const response = await apiClient.get<ChatQuotaResponse>("/chat/quota");
      setMessageQuota(response.data);
    } catch (error) {
      if ((error as Error)?.message === "AUTH_TOKEN_MISSING" || isUnauthorizedError(error)) {
        setStopPolling(true);
        return;
      }
      console.error("Failed to fetch chat quota:", error);
    }
  }, []);

  const fetchReviewStatus = useCallback(async (requestId: number) => {
    try {
      const response = await apiClient.get<MeetReviewStatusResponse>(
        `/meet/${requestId}/review/status`,
      );
      setCanReview(Boolean(response.data?.can_review));
      setReviewed(Boolean(response.data?.reviewed));
    } catch (error) {
      if ((error as Error)?.message === "AUTH_TOKEN_MISSING" || isUnauthorizedError(error)) {
        setStopPolling(true);
        return;
      }
      console.error("Failed to fetch review status:", error);
    }
  }, []);

  const fetchMeetStatus = useCallback(async () => {
    try {
      if (!Number.isFinite(chatUserId)) {
        return;
      }

      const response = await apiClient.get<MeetBetweenUsersResponse>(`/meet/between/${chatUserId}`);
      if (response.data?.exists) {
        const requestId = Number(response.data.request_id);
        const nextStatus = response.data.status;
        const nextRole = response.data.role;
        setMeetRequestStatus(
          nextStatus === "pending" ||
            nextStatus === "accepted" ||
            nextStatus === "rejected" ||
            nextStatus === "completed" ||
            nextStatus === "cancelled" ||
            nextStatus === "reported"
            ? nextStatus
            : "none",
        );
        setMeetRequestRole(nextRole === "sender" || nextRole === "receiver" ? nextRole : "none");
        setMeetRequestId(requestId);
        setMeetScheduledDate(response.data.scheduled_date || null);
        setMeetScheduledTime(response.data.scheduled_time || null);

        if (response.data.status === "completed") {
          fetchReviewStatus(requestId);
        } else {
          setCanReview(false);
          setReviewed(false);
        }
      } else {
        setMeetRequestStatus("none");
        setMeetRequestRole("none");
        setMeetRequestId(null);
        setMeetScheduledDate(null);
        setMeetScheduledTime(null);
        setCanReview(false);
        setReviewed(false);
      }
    } catch (error) {
      if ((error as Error)?.message === "AUTH_TOKEN_MISSING" || isUnauthorizedError(error)) {
        setStopPolling(true);
        return;
      }
      console.error("Failed to fetch meet status:", error);
    }
  }, [chatUserId, fetchReviewStatus]);

  useFocusEffect(
    useCallback(() => {
      if (stopPolling) {
        return;
      }

      let interval: ReturnType<typeof setInterval> | null = null;
      let currentAppState = AppState.currentState;

      const startPolling = () => {
        fetchMessages();
        fetchPartnerProfile();
        fetchMeetStatus();
        fetchMessageQuota();
        interval = setInterval(() => {
          fetchMessages();
          fetchMeetStatus();
        }, 60000); // 60秒間隔（アクティブ時＆フォーカス時のみ）へ変更（短期間隔によるAPIスパム防止）
      };

      const stopPollingTimer = () => {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      };

      if (currentAppState === "active") {
        startPolling();
      }

      const subscription = AppState.addEventListener("change", (nextAppState) => {
        if (currentAppState.match(/inactive|background/) && nextAppState === "active") {
          startPolling();
        } else if (nextAppState.match(/inactive|background/)) {
          stopPollingTimer();
        }
        currentAppState = nextAppState;
      });

      return () => {
        stopPollingTimer();
        subscription.remove();
      };
    }, [fetchMessages, fetchMeetStatus, fetchPartnerProfile, fetchMessageQuota, stopPolling]),
  );

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (snackbar === "review_posted") {
      setSnackbarMessage("レビュー投稿が完了しました");
      setShowSnackbar(true);
      setReviewed(true);
      setCanReview(false);
      const timer = setTimeout(() => {
        setShowSnackbar(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [snackbar]);

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }
    const timer = setTimeout(() => {
      messageListRef.current?.scrollToEnd({ animated: true });
    }, 0);
    return () => clearTimeout(timer);
  }, [messages.length]);

  const markVisibleMessagesAsRead = useCallback(
    async (messageIds: number[]) => {
      if (!Number.isFinite(chatUserId) || messageIds.length === 0) {
        return;
      }
      try {
        await apiClient.patch<ChatReadResponse>(`/chat/${chatUserId}/read`, { messageIds });
      } catch (error) {
        for (const id of messageIds) {
          requestedReadIdsRef.current.delete(id);
        }
        console.error("Failed to mark visible messages as read:", error);
      }
    },
    [chatUserId],
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const targetIds: number[] = [];
    for (const v of viewableItems) {
      const item = v.item as ChatMessage | undefined;
      if (!item || item.isSender || item.isRead) {
        continue;
      }
      if (!requestedReadIdsRef.current.has(item.id)) {
        requestedReadIdsRef.current.add(item.id);
        targetIds.push(item.id);
      }
    }
    if (targetIds.length > 0) {
      markVisibleMessagesAsRead(targetIds);
    }
  }).current;

  const openMeetModal = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setMeetDate(formatLocalDate(d));
    setMeetTime(formatLocalTime(d));
    setSelectedMeetSpotKey("hakata");
    setCustomMeetCoordinates(null);
    setPlaceSearchQuery("");
    setPlaceSearchResults([]);
    setMeetModalVisible(true);
  };

  const openCalendar = () => {
    setCalendarVisible(true);
  };

  const handlePlaceSearch = async () => {
    if (!placeSearchQuery.trim()) return;
    try {
      setPlaceSearching(true);
      const results = await searchNominatim(placeSearchQuery.trim());
      setPlaceSearchResults(results);
      if (results.length === 0) {
        Alert.alert("検索結果なし", "場所が見つかりませんでした。別のキーワードで試してください");
      }
    } catch {
      Alert.alert("エラー", "場所の検索に失敗しました");
    } finally {
      setPlaceSearching(false);
    }
  };

  const handleSelectPlace = (result: NominatimResult) => {
    const latitude = Number(result.lat);
    const longitude = Number(result.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    const label = result.display_name.split(",")[0];
    setCustomMeetCoordinates({ latitude, longitude, label });
    setSelectedMeetSpotKey("custom");
    setPlaceSearchVisible(false);
    setPlaceSearchQuery("");
    setPlaceSearchResults([]);
  };

  const handleSend = async () => {
    if (!input.trim() || !Number.isFinite(chatUserId)) return;

    try {
      setSending(true);
      await apiClient.post<ChatSendMessageResponse>(`/chat/${chatUserId}/messages`, {
        target_user_id: chatUserId,
        message: input,
      });
      setInput("");
      fetchMessages();
      fetchMessageQuota();
    } catch (error) {
      if ((error as any)?.response?.status === 429) {
        const rawDetail = (error as any)?.response?.data?.detail;
        const detailObj: QuotaLimitErrorDetail | null =
          rawDetail && typeof rawDetail === "object" ? rawDetail : null;
        const detailMessage =
          (typeof rawDetail === "string" ? rawDetail : detailObj?.message) ||
          "本日の送信上限に達しました";
        const rankProgress = detailObj?.rankProgress || messageQuota?.rankProgress;
        const progressText =
          rankProgress && !rankProgress.isMaxRank ? formatRankProgressLabel(rankProgress) : null;
        const alertMessage = progressText
          ? `${detailMessage}\n\n次ランク条件: ${progressText}`
          : detailMessage;
        Alert.alert("送信上限に達しました", alertMessage, [
          { text: "キャンセル", style: "cancel" },
          {
            text: "Boost を購入",
            onPress: () => router.push("/boost-purchase"),
          },
          {
            text: "Premium に加入",
            onPress: () => router.push("/premium-subscribe"),
          },
          {
            text: "次ランク条件を見る",
            onPress: () => router.push("/(tabs)/profile?focus=rank"),
          },
        ]);
        return;
      }
      console.error("Failed to send message:", error);
      Alert.alert("エラー", "メッセージ送信に失敗しました");
    } finally {
      setSending(false);
    }
  };

  const handleCreateMeet = async () => {
    if (!Number.isFinite(chatUserId)) {
      return;
    }

    const selectedMeetSpot = MEET_SPOTS.find((spot) => spot.key === selectedMeetSpotKey) || null;
    const resolvedMeetPoint =
      selectedMeetSpotKey === "custom"
        ? customMeetCoordinates
        : selectedMeetSpot
          ? {
              latitude: selectedMeetSpot.latitude,
              longitude: selectedMeetSpot.longitude,
              label: selectedMeetSpot.label,
            }
          : null;

    if (!resolvedMeetPoint) {
      Alert.alert("入力エラー", "待ち合わせ場所を選択してください");
      return;
    }

    try {
      const response = await apiClient.post<MeetRequestResponse>("/meet/request", {
        target_user_id: chatUserId,
        scheduled_date: meetDate,
        scheduled_time: meetTime,
        meet_latitude: resolvedMeetPoint.latitude,
        meet_longitude: resolvedMeetPoint.longitude,
      });
      setMeetRequestStatus("pending");
      setMeetRequestRole("sender");
      Alert.alert("送信完了", response.data?.message || "デート申込を送信しました");
    } catch (error) {
      console.error("Failed to request meet:", error);
      const detail = (error as any)?.response?.data?.detail;
      if (detail === "Active meet request already exists") {
        Alert.alert("申込済み", "進行中のデート申込があります");
        fetchMeetStatus();
      } else {
        Alert.alert("エラー", "デート申込の送信に失敗しました");
      }
    } finally {
      setMeetModalVisible(false);
    }
  };

  const handleMeetDecision = async (action: "accept" | "reject") => {
    if (!meetRequestId) {
      return;
    }

    try {
      const response = await apiClient.post<MeetDecisionResponse>(
        `/meet/${action}/${meetRequestId}`,
      );
      setMeetRequestStatus(action === "accept" ? "accepted" : "rejected");
      fetchMeetStatus();
      Alert.alert(
        "完了",
        response.data?.message ||
          (action === "accept" ? "デート申込を承諾しました" : "デート申込を却下しました"),
      );
    } catch (error) {
      console.error(`Failed to ${action} meet request:`, error);
      Alert.alert("エラー", "更新に失敗しました");
    }
  };

  const isQrAvailableNow = useMemo(() => {
    if (!meetScheduledDate || !meetScheduledTime) {
      return false;
    }

    const normalizedTime = meetScheduledTime.slice(0, 8);
    const localDateTime = new Date(`${meetScheduledDate}T${normalizedTime}`);
    if (Number.isNaN(localDateTime.getTime())) {
      return false;
    }

    return nowTick >= localDateTime.getTime();
  }, [meetScheduledDate, meetScheduledTime, nowTick]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#ffffff" }}
    >
      <View
        style={{
          height: 52,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          borderBottomWidth: 1,
          borderColor: "#e5e7eb",
          paddingHorizontal: 12,
        }}
      >
        <ScreenBackButton onPress={handleBackPress} compact />
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827" }}>{partnerName}</Text>
      </View>

      {showSnackbar && (
        <View
          style={{
            marginHorizontal: 12,
            marginBottom: 4,
            marginTop: 8,
            borderRadius: 8,
            backgroundColor: "#dcfce7",
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <Text style={{ textAlign: "center", fontSize: 12, fontWeight: "600", color: "#ffffff" }}>
            {snackbarMessage}
          </Text>
        </View>
      )}

      {messageQuota && (
        <View
          style={{
            marginHorizontal: 12,
            marginBottom: 4,
            marginTop: 8,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#ddd6fe",
            backgroundColor: "#f5f3ff",
            paddingHorizontal: 10,
            paddingVertical: 8,
          }}
        >
          <Text style={{ textAlign: "center", fontSize: 12, fontWeight: "600", color: "#1f2937" }}>
            {messageQuota.isUnlimited
              ? `本日の送信: ${messageQuota.usedToday}通 / 無制限 (Rank ${messageQuota.currentRank})`
              : `本日の送信: ${messageQuota.usedToday}/${messageQuota.dailyLimit}通（残り ${messageQuota.remainingToday}通） (Rank ${messageQuota.currentRank})`}
          </Text>
          {!messageQuota.isUnlimited && (messageQuota.boostBonusRemaining || 0) > 0 && (
            <Text style={{ marginTop: 6, color: "#ea580c", fontSize: 12, textAlign: "center" }}>
              Boost追加枠: 残り {messageQuota.boostBonusRemaining}通（期限なし・使い切り）
            </Text>
          )}
          {!messageQuota.isUnlimited &&
            messageQuota.rankProgress &&
            !messageQuota.rankProgress.isMaxRank &&
            formatRankProgressLabel(messageQuota.rankProgress) && (
              <Text style={{ marginTop: 6, color: "#6b7280", fontSize: 12 }}>
                次ランク条件: {formatRankProgressLabel(messageQuota.rankProgress)}
              </Text>
            )}
          {!messageQuota.isUnlimited && (
            <Button
              mode="text"
              compact
              textColor="#1d4ed8"
              contentStyle={{ alignSelf: "center" }}
              onPress={() => router.push("/(tabs)/profile?focus=rank")}
            >
              次ランク条件を見る
            </Button>
          )}
        </View>
      )}

      <View style={{ paddingHorizontal: 12, paddingTop: 10 }}>
        {meetRequestRole === "receiver" && meetRequestStatus === "pending" ? (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button
              mode="contained"
              buttonColor="#16a34a"
              textColor="#ffffff"
              style={{ flex: 1, borderRadius: 10 }}
              onPress={() => handleMeetDecision("accept")}
            >
              デート承諾
            </Button>
            <Button
              mode="contained"
              buttonColor="#dc2626"
              textColor="#ffffff"
              style={{ flex: 1, borderRadius: 10 }}
              onPress={() => handleMeetDecision("reject")}
            >
              デート却下
            </Button>
          </View>
        ) : meetRequestStatus === "pending" ? (
          <StatusInfoBox
            message="デート申込中です（承諾待ち）"
            containerStyle={statusInfoContainerStyle}
            textStyle={statusInfoTextStyle}
          />
        ) : meetRequestStatus === "accepted" ? (
          <StatusInfoBox
            message="デートが承諾されました"
            containerStyle={statusInfoContainerStyle}
            textStyle={statusInfoTextStyle}
          />
        ) : meetRequestStatus === "completed" ? (
          <>
            <StatusInfoBox
              message="デートは完了しました"
              containerStyle={statusInfoContainerStyle}
              textStyle={statusInfoTextStyle}
            />
            <Button
              mode="contained"
              buttonColor="#2563eb"
              textColor="#ffffff"
              style={{ borderRadius: 10 }}
              onPress={openMeetModal}
            >
              もう一度デートを申し込む
            </Button>
          </>
        ) : (
          <Button
            mode="contained"
            buttonColor="#2563eb"
            textColor="#ffffff"
            style={{ borderRadius: 10 }}
            onPress={openMeetModal}
          >
            デートを申し込む
          </Button>
        )}
      </View>

      {meetRequestStatus === "pending" && (
        <Button
          mode="contained"
          buttonColor="#d1d5db"
          textColor="#374151"
          style={{ marginHorizontal: 12, marginTop: 8, borderRadius: 10 }}
          onPress={() =>
            Alert.alert(
              "QRボタン",
              "当日現場に着いたら押せるようになります。当日読み取ってもらってください",
            )
          }
        >
          {meetRequestRole === "sender" ? "QRボタン（非活性）" : "カメラアイコン（非活性）"}
        </Button>
      )}

      {meetRequestStatus === "accepted" && meetRequestRole === "receiver" && (
        <Button
          mode="contained"
          buttonColor={isQrAvailableNow ? "#2563eb" : "#d1d5db"}
          textColor={isQrAvailableNow ? "#ffffff" : "#374151"}
          style={{ marginHorizontal: 12, marginTop: 8, borderRadius: 10 }}
          onPress={() => {
            if (!isQrAvailableNow) {
              Alert.alert("QRボタン", "約束時刻になると有効になります");
              return;
            }
            if (meetRequestId) {
              router.push(`/qr/${meetRequestId}`);
            }
          }}
        >
          {isQrAvailableNow ? "QRを読み取る" : "QRを読み取る（非活性）"}
        </Button>
      )}

      {meetRequestStatus === "accepted" && meetRequestRole === "sender" && (
        <Button
          mode="contained"
          buttonColor={isQrAvailableNow ? "#2563eb" : "#d1d5db"}
          textColor={isQrAvailableNow ? "#ffffff" : "#374151"}
          style={{ marginHorizontal: 12, marginTop: 8, borderRadius: 10 }}
          onPress={() => {
            if (!isQrAvailableNow) {
              Alert.alert("QRボタン", "約束時刻になると有効になります");
              return;
            }
            if (meetRequestId) {
              router.push(`/qr/${meetRequestId}`);
            }
          }}
        >
          {isQrAvailableNow ? "QRを表示する" : "QRを表示する（非活性）"}
        </Button>
      )}

      {meetRequestStatus === "completed" && canReview && !reviewed && (
        <Button
          mode="contained"
          buttonColor="#7c3aed"
          textColor="#ffffff"
          style={{ marginHorizontal: 12, marginTop: 8, borderRadius: 10 }}
          onPress={() =>
            meetRequestId &&
            router.push({
              pathname: "/review/[meetId]",
              params: {
                meetId: String(meetRequestId),
                chatUserId: String(chatUserId),
              },
            })
          }
        >
          レビューを書く
        </Button>
      )}

      {meetRequestStatus === "completed" && reviewed && (
        <StatusInfoBox
          message="レビュー投稿済みです"
          containerStyle={statusInfoContainerStyle}
          textStyle={statusInfoTextStyle}
        />
      )}

      {meetRequestStatus === "rejected" && (
        <StatusInfoBox
          message="デート申込は却下されました"
          containerStyle={statusInfoContainerStyle}
          textStyle={statusInfoTextStyle}
        />
      )}

      {meetRequestStatus === "cancelled" && (
        <StatusInfoBox
          message="デートは合意キャンセルされました"
          containerStyle={statusInfoContainerStyle}
          textStyle={statusInfoTextStyle}
        />
      )}

      {meetRequestStatus === "reported" && (
        <StatusInfoBox
          message="ドタキャン報告が登録されました"
          containerStyle={statusInfoContainerStyle}
          textStyle={statusInfoTextStyle}
        />
      )}

      <FlatList
        ref={messageListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        renderItem={({ item }) => (
          <View>
            <View
              style={{
                margin: 10,
                maxWidth: "80%",
                borderRadius: 24,
                alignSelf: item.isSender ? "flex-end" : "flex-start",
                backgroundColor: item.isSender ? "#ef4444" : "#f3f4f6",
              }}
            >
              <Text style={{ padding: 10, color: item.isSender ? "#ffffff" : "#000000" }}>
                {item.message}
              </Text>
            </View>
            {item.isSender && (
              <View style={{ margin: 10, maxWidth: "80%", alignSelf: "flex-end" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#6b7280" }}>
                    {item.isRead ? "既読" : "未読"}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ marginTop: 20, textAlign: "center", color: "#4b5563" }}>
            メッセージはありません
          </Text>
        }
      />

      <View
        style={{ flexDirection: "row", padding: 10, borderTopWidth: 1, borderTopColor: "#e5e7eb" }}
      >
        <PaperTextInput
          mode="outlined"
          dense
          value={input}
          onChangeText={setInput}
          placeholder="メッセージを入力..."
          textColor="#111827"
          placeholderTextColor="#6b7280"
          editable={!sending}
          style={{ flex: 1, marginRight: 10, backgroundColor: "#ffffff" }}
          outlineStyle={{ borderRadius: 20 }}
        />
        <Button
          mode="contained"
          buttonColor="#e74c3c"
          textColor="#ffffff"
          style={{ borderRadius: 20, justifyContent: "center" }}
          contentStyle={{ paddingHorizontal: 10 }}
          onPress={handleSend}
          disabled={sending}
        >
          送信
        </Button>
      </View>

      <Modal
        visible={meetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMeetModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
          <Pressable
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: "rgba(17, 24, 39, 0.24)",
            }}
            onPress={() => setMeetModalVisible(false)}
          />
          <View style={{ borderRadius: 12, backgroundColor: "#ffffff", padding: 16 }}>
            <Text style={{ marginBottom: 12, fontSize: 16, fontWeight: "700" }}>デート申込</Text>
            <TouchableOpacity
              style={{
                marginBottom: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#d1d5db",
                backgroundColor: "#ffffff",
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
              onPress={openCalendar}
            >
              <Text style={{ marginBottom: 2, fontSize: 12, color: "#6b7280" }}>日付</Text>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}>
                {meetDate || "日付を選択"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                marginBottom: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#d1d5db",
                backgroundColor: "#ffffff",
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
              onPress={() => setTimePickerVisible(true)}
            >
              <Text style={{ marginBottom: 2, fontSize: 12, color: "#6b7280" }}>時刻</Text>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}>
                {meetTime || "時刻を選択"}
              </Text>
            </TouchableOpacity>
            <Text style={{ marginBottom: 8, fontSize: 12, fontWeight: "600", color: "#374151" }}>
              待ち合わせ場所
            </Text>
            <View style={{ marginBottom: 10, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {MEET_SPOTS.map((spot) => {
                const selected = spot.key === selectedMeetSpotKey;
                return (
                  <TouchableOpacity
                    key={spot.key}
                    style={{
                      borderRadius: 8,
                      borderWidth: 1,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderColor: selected ? "#3b82f6" : "#d1d5db",
                      backgroundColor: selected ? "#dbeafe" : "#f9fafb",
                    }}
                    onPress={() => setSelectedMeetSpotKey(spot.key)}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: selected ? "#2563eb" : "#374151",
                      }}
                    >
                      {spot.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Button
              mode="contained"
              buttonColor="#1d4ed8"
              textColor="#ffffff"
              style={{ borderRadius: 8, marginBottom: 8 }}
              onPress={() => setPlaceSearchVisible(true)}
            >
              🔍 場所を検索して選ぶ
            </Button>
            {selectedMeetSpotKey === "custom" && customMeetCoordinates && (
              <Text style={{ marginBottom: 8, fontSize: 12, color: "#374151" }}>
                📍 {customMeetCoordinates.label}
              </Text>
            )}
            <View
              style={{ marginTop: 4, flexDirection: "row", justifyContent: "flex-end", gap: 8 }}
            >
              <Button
                mode="contained"
                buttonColor="#2563eb"
                textColor="#ffffff"
                style={{ borderRadius: 8 }}
                onPress={handleCreateMeet}
              >
                送信
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      <DatePickerModal
        visible={calendarVisible}
        selectedDate={meetDate}
        onSelectDate={setMeetDate}
        onClose={() => setCalendarVisible(false)}
      />

      <TimePickerModal
        visible={timePickerVisible}
        selectedTime={meetTime}
        onSelectTime={setMeetTime}
        onClose={() => setTimePickerVisible(false)}
      />

      <Modal
        visible={placeSearchVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPlaceSearchVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Pressable
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: "rgba(17, 24, 39, 0.24)",
            }}
            onPress={() => setPlaceSearchVisible(false)}
          />
          <View style={{ backgroundColor: "#ffffff", padding: 16 }}>
            <Text style={{ marginBottom: 12, fontSize: 16, fontWeight: "700" }}>場所を検索</Text>
            <View style={{ marginBottom: 12, flexDirection: "row", gap: 8 }}>
              <PaperTextInput
                mode="outlined"
                dense
                value={placeSearchQuery}
                onChangeText={setPlaceSearchQuery}
                placeholder="例: 渋谷スクランブル交差点"
                textColor="#111827"
                placeholderTextColor="#6b7280"
                autoFocus
                onSubmitEditing={handlePlaceSearch}
                returnKeyType="search"
                style={{ flex: 1, backgroundColor: "#ffffff" }}
                outlineStyle={{ borderRadius: 8 }}
              />
              <Button
                mode="contained"
                buttonColor="#2563eb"
                textColor="#ffffff"
                style={{ borderRadius: 8, justifyContent: "center" }}
                onPress={handlePlaceSearch}
                disabled={placeSearching}
              >
                {placeSearching ? "…" : "検索"}
              </Button>
            </View>
            <FlatList
              data={placeSearchResults}
              keyExtractor={(item) => String(item.place_id)}
              style={
                {
                  /* max-h-80 */
                }
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    borderBottomWidth: 1,
                    borderColor: "#f3f4f6",
                    paddingHorizontal: 4,
                    paddingVertical: 10,
                  }}
                  onPress={() => handleSelectPlace(item)}
                >
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827" }}>
                    {item.display_name.split(",")[0]}
                  </Text>
                  <Text style={{ marginTop: 2, fontSize: 12, color: "#6b7280" }} numberOfLines={1}>
                    {item.display_name}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={placeSearchResults.length === 0 && !placeSearching ? null : null}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
