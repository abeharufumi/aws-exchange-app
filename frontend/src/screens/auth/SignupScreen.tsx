import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { useAuthStore } from "../../stores/authStore";

export function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState("male");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const signup = useAuthStore((state) => state.signup);

  const handleSignup = async () => {
    if (!email || !password || !displayName || !phone) {
      Alert.alert("エラー", "全ての項目を入力してください");
      return;
    }

    try {
      setLoading(true);
      await signup({ email, password, displayName, gender, phone });
    } catch (error: any) {
      Alert.alert("サインアップ失敗", error.response?.data?.detail || "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>新規登録</Text>

      <TextInput
        style={styles.input}
        placeholder="メール"
        value={email}
        onChangeText={setEmail}
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="パスワード"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="表示名"
        value={displayName}
        onChangeText={setDisplayName}
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="電話番号"
        value={phone}
        onChangeText={setPhone}
        editable={!loading}
      />

      <View style={styles.genderContainer}>
        <TouchableOpacity
          style={[styles.genderButton, gender === "male" && styles.genderButtonActive]}
          onPress={() => setGender("male")}
          disabled={loading}
        >
          <Text style={styles.genderButtonText}>男性</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.genderButton, gender === "female" && styles.genderButtonActive]}
          onPress={() => setGender("female")}
          disabled={loading}
        >
          <Text style={styles.genderButtonText}>女性</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSignup}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? "登録中..." : "登録"}</Text>
      </TouchableOpacity>
    </ScrollView>
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
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
  },
  genderContainer: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 10,
  },
  genderButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    alignItems: "center",
  },
  genderButtonActive: {
    backgroundColor: "#e74c3c",
    borderColor: "#e74c3c",
  },
  genderButtonText: {
    fontSize: 16,
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
