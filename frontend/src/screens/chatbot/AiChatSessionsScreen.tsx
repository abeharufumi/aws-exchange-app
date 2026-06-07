import React, { useEffect, useState } from "react";
import { View, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { Stack, useRouter } from "expo-router";
import { getChatSessions, createChatSession, ChatSession } from "../../services/aiChatApi";
import { ThemedText } from "../../../components/themed-text";
import { ThemedView } from "../../../components/themed-view";
import { Colors } from "../../../constants/theme";
import { useColorScheme } from "../../../hooks/use-color-scheme";
import { IconSymbol } from "../../../components/ui/icon-symbol";

interface AiChatSessionsScreenProps {
  showHeader?: boolean;
}

export function AiChatSessionsScreen({ showHeader = true }: AiChatSessionsScreenProps = {}) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  
  const cardColor = (colors as any).card || (colorScheme === "dark" ? "#1e1e1e" : "#fff");
  const borderColor = (colors as any).border || (colorScheme === "dark" ? "#333" : "#e5e5e5");

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const data = await getChatSessions();
      setSessions(data);
    } catch (error) {
      console.error("Failed to fetch sessions", error);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = async () => {
    setLoading(true);
    try {
      const newSession = await createChatSession("新しいチャット");
      router.push({ pathname: "/chatbot/[sessionId]", params: { sessionId: newSession.id } } as any);
    } catch (error) {
      console.error("Failed to create session", error);
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: ChatSession }) => {
    return (
      <TouchableOpacity 
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          borderBottomWidth: 1,
          backgroundColor: cardColor, 
          borderBottomColor: borderColor
        }}
        onPress={() => router.push({ pathname: "/chatbot/[sessionId]", params: { sessionId: item.id } } as any)}
      >
        <View style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: "rgba(10, 126, 164, 0.1)",
          justifyContent: "center",
          alignItems: "center",
          marginRight: 16,
        }}>
          <IconSymbol name="message.fill" size={24} color={colors.tint} />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText style={{ fontSize: 16, fontWeight: "600", marginBottom: 4 }} numberOfLines={1}>{item.title}</ThemedText>
          <ThemedText style={{ fontSize: 12, color: colors.tabIconDefault }}>
            {new Date(item.updated_at).toLocaleDateString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </ThemedText>
        </View>
        <IconSymbol name="chevron.right" size={20} color={colors.tabIconDefault} />
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      {showHeader && <Stack.Screen options={{ title: "AI コンシェルジュ履歴", headerBackTitle: "戻る" }} />}
      
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: borderColor }}>
        <TouchableOpacity 
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            padding: 14,
            borderRadius: 8,
            backgroundColor: colors.tint
          }}
          onPress={startNewChat}
          disabled={loading}
        >
          <IconSymbol name="plus.circle.fill" size={20} color="#fff" style={{ marginRight: 8 }} />
          <ThemedText style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>新しいチャットを始める</ThemedText>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : sessions.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <ThemedText style={{ color: colors.tabIconDefault, textAlign: 'center' }}>
            チャット履歴がありません。{'\n'}AIにプロフィール相談やアプリの質問をしてみましょう！
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </ThemedView>
  );
}
