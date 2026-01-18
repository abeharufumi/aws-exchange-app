import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from "react-native";
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
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <Text style={styles.label}>最小年齢</Text>
        <TextInput
          style={styles.input}
          value={minAge}
          onChangeText={setMinAge}
          keyboardType="number-pad"
        />

        <Text style={styles.label}>最大年齢</Text>
        <TextInput
          style={styles.input}
          value={maxAge}
          onChangeText={setMaxAge}
          keyboardType="number-pad"
        />

        <TouchableOpacity style={styles.button} onPress={handleSearch} disabled={searching}>
          <Text style={styles.buttonText}>{searching ? "検索中..." : "検索"}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.userItem}>
            <Text style={styles.userName}>
              {item.displayName}, {item.age}
            </Text>
            <Text style={styles.userBio}>{item.bio}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  filterContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 6,
  },
  button: {
    backgroundColor: "#e74c3c",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  userItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  userBio: {
    fontSize: 14,
    color: "#666",
  },
});
