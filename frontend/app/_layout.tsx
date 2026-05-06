import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { ActivityIndicator, PaperProvider, Surface } from "react-native-paper";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider, useAuth } from "@/src/contexts/auth";
import { darkPaperTheme, lightPaperTheme } from "../src/theme/customTheme";
import { LogBox } from "react-native";

// React Native内部の非推奨警告を抑制（開発環境のみ）
LogBox.ignoreLogs(["props.pointerEvents is deprecated"]);

/**
 * ルートレイアウト
 * 認証状態に基づいてナビゲーション構造を切り替える
 */
function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { isSignedIn, isLoading } = useAuth();
  const isDark = colorScheme === "dark";

  if (isLoading) {
    return (
      <Surface elevation={0} style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </Surface>
    );
  }

  return (
    <PaperProvider theme={isDark ? darkPaperTheme : lightPaperTheme}>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          {isSignedIn ? (
            <>
              {/* ログイン済み時のナビゲーション */}
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="user/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="qr/[meetRequestId]" options={{ headerShown: false }} />
              <Stack.Screen name="review/[meetId]" options={{ headerShown: false }} />
              <Stack.Screen name="live" options={{ headerShown: false }} />
              <Stack.Screen name="live/[streamId]" options={{ headerShown: false }} />
              <Stack.Screen name="fanclub" options={{ headerShown: false }} />
              <Stack.Screen name="fanclub/[creatorId]" options={{ headerShown: false }} />
              <Stack.Screen name="footprint" options={{ headerShown: false }} />
              <Stack.Screen name="gifts" options={{ headerShown: false }} />
              <Stack.Screen name="icon-frame-shop" options={{ headerShown: false }} />
              <Stack.Screen name="boost-purchase" options={{ headerShown: false }} />
              <Stack.Screen name="premium-subscribe" options={{ headerShown: false }} />
              <Stack.Screen name="call-tickets" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: "modal" }} />
            </>
          ) : (
            // 未認証時は認証画面
            <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          )}
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}
