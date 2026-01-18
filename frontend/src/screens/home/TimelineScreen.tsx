import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import apiClient from "../../services/api";

export function TimelineScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/users/discover");
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (action: "like" | "pass") => {
    if (currentIndex < users.length) {
      const userId = users[currentIndex].id;
      try {
        await apiClient.post("/matches/like", {
          targetUserId: userId,
          action,
        });
        setCurrentIndex(currentIndex + 1);
      } catch (error) {
        console.error("Failed to submit action:", error);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#e74c3c" />
      </View>
    );
  }

  if (currentIndex >= users.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>ユーザーがいません</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            setCurrentIndex(0);
            fetchUsers();
          }}
        >
          <Text style={styles.buttonText}>リロード</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentUser = users[currentIndex];

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.userName}>
          {currentUser.displayName}, {currentUser.age}
        </Text>
        <Text style={styles.userInfo}>{currentUser.bio}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.passButton]}
          onPress={() => handleSwipe("pass")}
        >
          <Text style={styles.actionButtonText}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => handleSwipe("like")}
        >
          <Text style={styles.actionButtonText}>♥</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "100%",
    padding: 20,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    marginBottom: 20,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  userInfo: {
    fontSize: 16,
    color: "#666",
  },
  actions: {
    flexDirection: "row",
    gap: 20,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  passButton: {
    backgroundColor: "#ccc",
  },
  likeButton: {
    backgroundColor: "#e74c3c",
  },
  actionButtonText: {
    fontSize: 24,
    color: "white",
  },
  button: {
    backgroundColor: "#e74c3c",
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 20,
  },
});
