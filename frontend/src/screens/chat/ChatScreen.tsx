import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import apiClient from "../../services/api";

export function ChatScreen({ route }: any) {
  const { id } = route.params;
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const interval = setInterval(fetchMessages, 3000);
    fetchMessages();
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await apiClient.get(`/chats/${id}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    try {
      setSending(true);
      await apiClient.post(`/chats/${id}/messages`, { content: input });
      setInput("");
      fetchMessages();
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageContainer,
              item.isSender ? styles.senderMessage : styles.receiverMessage,
            ]}
          >
            <Text style={[styles.messageText, item.isSender && styles.senderMessageText]}>
              {item.content}
            </Text>
          </View>
        )}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="メッセージを入力..."
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.button, sending && styles.buttonDisabled]}
          onPress={handleSend}
          disabled={sending}
        >
          <Text style={styles.buttonText}>送信</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  messageContainer: {
    margin: 10,
    maxWidth: "80%",
  },
  senderMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#e74c3c",
    borderRadius: 15,
  },
  receiverMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#f0f0f0",
    borderRadius: 15,
  },
  messageText: {
    padding: 10,
    color: "#000",
  },
  senderMessageText: {
    color: "white",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  button: {
    backgroundColor: "#e74c3c",
    paddingHorizontal: 20,
    justifyContent: "center",
    borderRadius: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
