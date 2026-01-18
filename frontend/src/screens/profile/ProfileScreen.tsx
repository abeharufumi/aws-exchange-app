import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useAuthStore } from "../../stores/authStore";
import apiClient from "../../services/api";

export function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get("/users/me");
      setProfile(response.data);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
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

  return (
    <View style={styles.container}>
      {profile && (
        <>
          <View style={styles.profileHeader}>
            <Text style={styles.displayName}>{profile.displayName}</Text>
            <Text style={styles.info}>
              {profile.age}歳 • {profile.gender === "male" ? "男性" : "女性"}
            </Text>
            <Text style={styles.info}>📧 {profile.email}</Text>
            <Text style={styles.info}>📱 {profile.phone}</Text>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={() => Alert.alert("プロフィール編集", "準備中です")}
          >
            <Text style={styles.buttonText}>プロフィール編集</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
            <Text style={styles.buttonText}>ログアウト</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  profileHeader: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  displayName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  info: {
    fontSize: 16,
    marginBottom: 5,
    color: "#666",
  },
  button: {
    backgroundColor: "#e74c3c",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: "#999",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
