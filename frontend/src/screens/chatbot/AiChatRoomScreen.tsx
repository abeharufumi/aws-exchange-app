import React, { useEffect, useState, useRef } from "react";
import { View, TextInput, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { getSessionMessages, API_BASE_URL, ChatMessage } from "../../services/aiChatApi";
import { ThemedText } from "../../../components/themed-text";
import { ThemedView } from "../../../components/themed-view";
import { Colors } from "../../../constants/theme";
import { useColorScheme } from "../../../hooks/use-color-scheme";
import { IconSymbol } from "../../../components/ui/icon-symbol";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function AiChatRoomScreen() {
  const { sessionId } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const cardColor = (colors as any).card || (colorScheme === "dark" ? "#1e1e1e" : "#fff");
  const borderColor = (colors as any).border || (colorScheme === "dark" ? "#333" : "#e5e5e5");
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [isReceiving, setIsReceiving] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchHistory();
  }, [sessionId]);

  const fetchHistory = async () => {
    try {
      const history = await getSessionMessages(sessionId as string);
      setMessages(history);
    } catch (error) {
      console.error("Failed to fetch messages", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isReceiving) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      session_id: sessionId as string,
      role: "user",
      content: inputText.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsReceiving(true);

    const assistantMsgId = Date.now() + 1;
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        session_id: sessionId as string,
        role: "assistant",
        content: "",
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      const token = await AsyncStorage.getItem("authToken");

      const response = await fetch(`${API_BASE_URL}/chatbot/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: userMsg.content,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // @ts-ignore
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const textChunk = decoder.decode(value, { stream: true });
          
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, content: msg.content + textChunk } : msg
            )
          );
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, content: "通信エラーが発生しました。もう一度お試しください。" }
            : msg
        )
      );
    } finally {
      setIsReceiving(false);
    }
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";
    return (
      <View style={{ marginBottom: 16, flexDirection: "row", justifyContent: isUser ? "flex-end" : "flex-start" }}>
        <View
          style={[
            { maxWidth: "80%", padding: 12, borderRadius: 16 },
            isUser ? { backgroundColor: colors.tint } : { backgroundColor: cardColor, borderColor: borderColor, borderWidth: 1 }
          ]}
        >
          <ThemedText style={{ fontSize: 15, lineHeight: 22, color: isUser ? "#fff" : colors.text }}>
            {item.content || (isReceiving && !isUser ? "..." : "")}
          </ThemedText>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <Stack.Screen options={{ title: "AI コンシェルジュ", headerBackTitle: "戻る" }} />
      <ThemedView style={{ flex: 1 }}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 16 }}
            renderItem={renderItem}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}
        
        <View style={{
          flexDirection: "row",
          padding: 12,
          paddingBottom: Platform.OS === "ios" ? 30 : 12,
          borderTopWidth: 1,
          alignItems: "flex-end",
          borderTopColor: borderColor, 
          backgroundColor: colors.background
        }}>
          <TextInput
            style={{
              flex: 1,
              minHeight: 40,
              maxHeight: 120,
              borderWidth: 1,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingTop: 10,
              paddingBottom: 10,
              marginRight: 10,
              fontSize: 15,
              color: colors.text, 
              borderColor: borderColor, 
              backgroundColor: cardColor
            }}
            placeholder="メッセージを入力..."
            placeholderTextColor={colors.tabIconDefault}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[
              {
                width: 44,
                height: 44,
                borderRadius: 22,
                justifyContent: "center",
                alignItems: "center"
              },
              (!inputText.trim() || isReceiving) ? { backgroundColor: borderColor } : { backgroundColor: colors.tint }
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isReceiving}
          >
            <IconSymbol name="arrow.up.circle.fill" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}
