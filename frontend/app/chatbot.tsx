import { Stack } from "expo-router";
import { AiChatSessionsScreen } from "../src/screens/chatbot/AiChatSessionsScreen";

export default function Page() {
  return (
    <>
      <Stack.Screen options={{ title: "AI コンシェルジュ", headerBackTitle: "戻る" }} />
      <AiChatSessionsScreen />
    </>
  );
}
