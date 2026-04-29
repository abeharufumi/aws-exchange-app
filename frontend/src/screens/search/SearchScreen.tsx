import React, { useState } from "react";
import { FlatList, Text, View } from "react-native";
import { Button, Surface, TextInput } from "react-native-paper";
import apiClient from "../../services/api";

export function SearchScreen() {
  const [minAge, setMinAge] = useState("18");
  const [maxAge, setMaxAge] = useState("50");
  const [users, setUsers] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

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

      <FlatList
        data={users}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View
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
            <Text style={{ fontSize: 14, color: "#6b7280" }}>{item.bio}</Text>
          </View>
        )}
      />
    </View>
  );
}
