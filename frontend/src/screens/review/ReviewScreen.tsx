import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from "react-native";
import apiClient from "../../services/api";

export function ReviewScreen({ route }: any) {
  const { meetId } = route.params;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert("エラー", "評価を選択してください");
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post(`/meets/${meetId}/review`, {
        rating,
        comment,
      });
      Alert.alert("成功", "レビューが投稿されました");
    } catch (error) {
      Alert.alert("エラー", "レビュー投稿に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>レビュー</Text>

      <View style={styles.ratingContainer}>
        <Text style={styles.label}>評価:</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((i) => (
            <TouchableOpacity key={i} onPress={() => setRating(i)} disabled={submitting}>
              <Text style={[styles.star, rating >= i && styles.starActive]}>★</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.commentContainer}>
        <Text style={styles.label}>コメント:</Text>
        <TextInput
          style={styles.input}
          placeholder="コメントを入力..."
          value={comment}
          onChangeText={setComment}
          editable={!submitting}
          multiline
        />
      </View>

      <TouchableOpacity
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={handleSubmitReview}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>{submitting ? "投稿中..." : "投稿"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  ratingContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  stars: {
    flexDirection: "row",
    gap: 10,
  },
  star: {
    fontSize: 32,
    color: "#ddd",
  },
  starActive: {
    color: "#ffc107",
  },
  commentContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    height: 100,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#e74c3c",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
