import React, { useState } from "react";
import { Alert, View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Text, TextInput } from "react-native-paper";
import { useAuth } from "../../contexts/auth";

export function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState("male");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  const handleSignup = async () => {
    if (!email || !password || !displayName) {
      Alert.alert("エラー", "全ての項目を入力してください");
      return;
    }
    try {
      setLoading(true);
      await signup(email, password, gender, displayName);
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("サインアップ失敗", error?.message || "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <View
        style={{
          flex: 1,
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingVertical: 40,
        }}
      >
        <View style={{ marginBottom: 40, alignItems: "center" }}>
          <Text
            variant="headlineLarge"
            style={{ marginBottom: 8, fontWeight: "bold", color: "#1f2937" }}
          >
            AWS Exchange
          </Text>
          <Text variant="bodyMedium" style={{ color: "#6b7280" }}>
            新規登録
          </Text>
        </View>

        <View style={{ marginBottom: 32 }}>
          <View style={{ marginBottom: 20 }}>
            <Text variant="labelLarge" style={{ marginBottom: 8, color: "#1f2937" }}>
              メールアドレス
            </Text>
            <TextInput
              mode="outlined"
              placeholder="example@example.com"
              textColor="#111827"
              placeholderTextColor="#6b7280"
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
            <Text variant="labelLarge" style={{ marginBottom: 8, color: "#1f2937" }}>
              パスワード
            </Text>
            <TextInput
              mode="outlined"
              placeholder="8文字以上"
              textColor="#111827"
              placeholderTextColor="#6b7280"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              disabled={loading}
              style={{ backgroundColor: "#fff" }}
              outlineStyle={{ borderRadius: 8 }}
            />
          </View>
          <View style={{ marginBottom: 20 }}>
            <Text variant="labelLarge" style={{ marginBottom: 8, color: "#1f2937" }}>
              表示名
            </Text>
            <TextInput
              mode="outlined"
              placeholder="Taro Yamada"
              textColor="#111827"
              placeholderTextColor="#6b7280"
              value={displayName}
              onChangeText={setDisplayName}
              disabled={loading}
              style={{ backgroundColor: "#fff" }}
              outlineStyle={{ borderRadius: 8 }}
            />
          </View>
          <View style={{ marginBottom: 20 }}>
            <Text variant="labelLarge" style={{ marginBottom: 8, color: "#1f2937" }}>
              性別
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Button
                mode={gender === "male" ? "contained" : "outlined"}
                onPress={() => setGender("male")}
                disabled={loading}
                style={{ flex: 1 }}
              >
                男性
              </Button>
              <Button
                mode={gender === "female" ? "contained" : "outlined"}
                onPress={() => setGender("female")}
                disabled={loading}
                style={{ flex: 1 }}
              >
                女性
              </Button>
            </View>
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Button
            mode="contained"
            buttonColor="#3b82f6"
            textColor="#fff"
            style={{ borderRadius: 8 }}
            contentStyle={{ paddingVertical: 4 }}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? "登録中..." : "登録"}
          </Button>
        </View>

        <View style={{ marginBottom: 32, alignItems: "center" }}>
          <Text variant="bodySmall" style={{ marginBottom: 4, color: "#6b7280" }}>
            すでにアカウントをお持ちですか？
          </Text>
          <Button mode="text" onPress={() => router.push("/auth/login")} disabled={loading}>
            ログインへ
          </Button>
        </View>
      </View>
    </View>
  );
}
