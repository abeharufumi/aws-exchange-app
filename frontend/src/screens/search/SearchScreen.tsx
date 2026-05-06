import React, { useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Button, Surface, TextInput } from "react-native-paper";
import { useRouter } from "expo-router";
import { UserPresenceStatus } from "../../components/common/UserPresenceStatus";
import apiClient from "../../services/api";
import { UserCard } from "../../types/user";

export function SearchScreen() {
  const [minAge, setMinAge] = useState("18");
  const [maxAge, setMaxAge] = useState("50");
  const [users, setUsers] = useState<UserCard[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const router = useRouter();

  const getMembershipLabel = (item: UserCard): string => {
    if (item.isPremiumActive) {
      return "Premium";
    }
    if (item.isBoostActive) {
      return "Boost";
    }
    return "通常";
  };

  const handleSearch = async () => {
    try {
      setSearching(true);
      const response = await apiClient.get("/users/search", {
        params: {
          minAge: parseInt(minAge),
          maxAge: parseInt(maxAge),
        },
      });
      setUsers(response.data);
      setSearched(true);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", padding: 20 }}>
      <Surface
        elevation={0}
        style={{ marginBottom: 20, borderRadius: 8, backgroundColor: "#f3f4f6", padding: 16 }}
      >
        <Text style={{ marginBottom: 4, fontSize: 14, fontWeight: "bold", color: "#111827" }}>
          最小年齢
        </Text>
        <TextInput
          mode="outlined"
          dense
          value={minAge}
          onChangeText={setMinAge}
          textColor="#111827"
          placeholderTextColor="#6b7280"
          keyboardType="number-pad"
          style={{ marginBottom: 12, backgroundColor: "#ffffff" }}
          outlineStyle={{ borderRadius: 6 }}
        />

        <Text style={{ marginBottom: 4, fontSize: 14, fontWeight: "bold", color: "#111827" }}>
          最大年齢
        </Text>
        <TextInput
          mode="outlined"
          dense
          value={maxAge}
          onChangeText={setMaxAge}
          textColor="#111827"
          placeholderTextColor="#6b7280"
          keyboardType="number-pad"
          style={{ marginBottom: 12, backgroundColor: "#ffffff" }}
          outlineStyle={{ borderRadius: 6 }}
        />

        <Button
          mode="contained"
          buttonColor="#e74c3c"
          textColor="#ffffff"
          style={{ borderRadius: 6 }}
          onPress={handleSearch}
          disabled={searching}
        >
          {searching ? "検索中..." : "検索"}
        </Button>
      </Surface>

      <View style={{ flex: 1, position: "relative" }}>
        {searching && (
          <View
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.7)",
            }}
          >
            <ActivityIndicator animating color="#e74c3c" size="large" />
          </View>
        )}
        <FlatList
          style={{ opacity: searching ? 0.4 : 1 }}
          data={users}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push(`/user/${item.id}`)}
              style={{
                borderBottomWidth: 1,
                borderBottomColor: "#e5e7eb",
                paddingHorizontal: 4,
                paddingVertical: 16,
              }}
            >
              <Text style={{ marginBottom: 4, fontSize: 16, fontWeight: "bold", color: "#111827" }}>
                {item.displayName}, {item.age}
              </Text>
              <View style={{ marginBottom: 6, flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View
                  style={{
                    borderRadius: 9999,
                    backgroundColor: "#e5e7eb",
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#374151" }}>
                    Rank {item.rank || 1}
                  </Text>
                </View>
                <View
                  style={{
                    borderRadius: 9999,
                    backgroundColor: item.isPremiumActive
                      ? "#ede9fe"
                      : item.isBoostActive
                        ? "#dbeafe"
                        : "#f3f4f6",
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: item.isPremiumActive
                        ? "#6d28d9"
                        : item.isBoostActive
                          ? "#1d4ed8"
                          : "#6b7280",
                    }}
                  >
                    {getMembershipLabel(item)}
                  </Text>
                </View>
              </View>
              <UserPresenceStatus status={item.onlineStatus} lastActiveAt={item.lastActiveAt} />
              <Text style={{ fontSize: 14, color: "#6b7280" }}>{item.bio}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
}
