import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, Text, TouchableOpacity, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import apiClient from "../../services/api";
import { MeetReviewStatusResponse, MeetReviewSubmitResponse } from "../../types/meet";

export function ReviewScreen({ route }: any) {
  const router = useRouter();
  const { meetId, chatUserId } = route.params;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [canReview, setCanReview] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      if (!meetId) {
        setStatusLoading(false);
        return;
      }
      try {
        const res = await apiClient.get<MeetReviewStatusResponse>(`/meet/${meetId}/review/status`);
        setAlreadyReviewed(res.data.reviewed);
        setCanReview(res.data.can_review);
      } catch {
        // ステータス取得失敗時は投稿可として扱う
      } finally {
        setStatusLoading(false);
      }
    };
    checkStatus();
  }, [meetId]);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert("エラー", "評価を選択してください");
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiClient.post<MeetReviewSubmitResponse>(`/meet/${meetId}/review`, {
        rating,
        comment,
      });
      if (chatUserId) {
        router.replace({
          pathname: "/chat/[id]",
          params: {
            id: String(chatUserId),
            snackbar: "review_posted",
          },
        });
        return;
      }
      Alert.alert("完了", response.data?.message || "レビューを投稿しました");
      router.back();
    } catch (error: any) {
      Alert.alert("エラー", error?.response?.data?.detail || "レビュー投稿に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (statusLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000000",
          paddingHorizontal: 20,
          paddingVertical: 20,
        }}
      >
        <ActivityIndicator size="large" color="#e74c3c" />
      </View>
    );
  }

  if (alreadyReviewed) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000000",
          paddingVertical: 32,
        }}
      >
        <Text style={{ textAlign: "center", fontSize: 16 }}>
          このデートのレビューは投稿済みです
        </Text>
        <TouchableOpacity
          style={{
            marginTop: 24,
            alignItems: "center",
            borderRadius: 8,
            backgroundColor: "#ef4444",
            paddingHorizontal: 20,
            paddingVertical: 12,
          }}
          onPress={() => router.back()}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#ffffff" }}>戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!canReview) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000000",
          paddingVertical: 32,
        }}
      >
        <Text style={{ textAlign: "center", fontSize: 16 }}>現在レビューを投稿できません</Text>
        <TouchableOpacity
          style={{
            marginTop: 24,
            alignItems: "center",
            borderRadius: 8,
            backgroundColor: "#ef4444",
            paddingHorizontal: 20,
            paddingVertical: 12,
          }}
          onPress={() => router.back()}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#ffffff" }}>戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={{ flex: 1, backgroundColor: "#000000", paddingHorizontal: 20, paddingVertical: 20 }}
    >
      <Text
        style={{
          marginBottom: 20,
          textAlign: "center",
          fontSize: 24,
          fontWeight: "700",
          color: "#ffffff",
        }}
      >
        レビュー
      </Text>

      <View style={{ marginBottom: 20 }}>
        <Text style={{ marginBottom: 10, fontSize: 16, fontWeight: "700", color: "#ffffff" }}>
          評価:
        </Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <TouchableOpacity key={i} onPress={() => setRating(i)} disabled={submitting}>
              <Text style={{ fontSize: 36, color: rating >= i ? "#ffc107" : "#6b7280" }}>★</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={{ marginBottom: 10, fontSize: 16, fontWeight: "700", color: "#ffffff" }}>
          コメント:
        </Text>
        <TextInput
          style={[
            {
              borderRadius: 8,
              borderWidth: 1,
              backgroundColor: "#ffffff",
              paddingHorizontal: 12,
              paddingVertical: 12,
              color: "#111827",
            },
            { textAlignVertical: "top" },
          ]}
          placeholder="コメントを入力..."
          placeholderTextColor="#6b7280"
          value={comment}
          onChangeText={setComment}
          editable={!submitting}
          multiline
        />
      </View>

      <TouchableOpacity
        style={[
          {
            alignItems: "center",
            borderRadius: 8,
            backgroundColor: "#ef4444",
            paddingVertical: 14,
          },
          submitting ? { opacity: 0.6 } : undefined,
        ]}
        onPress={handleSubmitReview}
        disabled={submitting}
      >
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#ffffff" }}>
          {submitting ? "投稿中..." : "投稿"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
