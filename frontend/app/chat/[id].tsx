import { useLocalSearchParams } from "expo-router";
import { ChatScreen as ChatScreenImpl } from "../../src/screens/chat/ChatScreen";

export default function ChatScreen() {
  const { id, snackbar } = useLocalSearchParams<{ id?: string; snackbar?: string }>();

  return <ChatScreenImpl route={{ params: { id: id ?? "", snackbar: snackbar ?? "" } }} />;
}
