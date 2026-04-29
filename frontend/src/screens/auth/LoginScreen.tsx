import React, { useState } from "react";
import { Alert, View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Text, TextInput } from "react-native-paper";
import { useAuth } from "../../contexts/auth";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("エラー", "メールとパスワードを入力してください");
      return;
    }
    try {
      setLoading(true);
      await login(email, password);
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("ログイン失敗", error?.message || "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <View style={{ flex: 1, justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 40 }}>
        <View style={{ marginBottom: 40, alignItems: "center" }}>
          <Text variant="headlineLarge" style={{ marginBottom: 8, fontWeight: "bold", color: "#1f2937" }}>AWS Exchange</Text>
          <Text variant="bodyMedium" style={{ color: "#6b7280" }}>ログイン</Text>
        </View>

        <View style={{ marginBottom: 32 }}>
          <View style={{ marginBottom: 20 }}>
            <Text variant="labelLarge" style={{ marginBottom: 8, color: "#1f2937" }}>メールアドレス</Text>
            <TextInput
              mode="outlined"
              placeholder="example@example.com"
              value={email}
              onChangeText={setEmail}
              disabled={loading}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{ backgroundColor: "#fff" }}
              outlineStyle={{ borderRadius: 8 }}
            />
          </View>
          <View style={{ marginBottom: 20 }}>
            <Text variant="labelLarge" style={{ marginBottom: 8, color: "#1f2937" }}>パスワード</Text>
            <TextInput
              mode="outlined"
              placeholder="8文字以上"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              disabled={loading}
              style={{ backgroundColor: "#fff" }}
              outlineStyle={{ borderRadius: 8 }}
            />
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Button
            mode="contained"
            buttonColor="#3b82f6"
            textColor="#fff"
            style={{ borderRadius: 8 }}
            contentStyle={{ paddingVertical: 4 }}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? "ログイン中..." : "ログイン"}
          </Button>
        </View>

        <View style={{ marginBottom: 32, alignItems: "center" }}>
          <Text variant="bodySmall" style={{ marginBottom: 4, color: "#6b7280" }}>アカウントをお持ちでないですか？</Text>
          <Button mode="text" onPress={() => router.push("/auth/signup")} disabled={loading}>
            新規登録へ
          </Button>
        </View>
      </View>
    </View>
  );
}

