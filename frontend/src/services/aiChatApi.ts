import { API_FULL_BASE_URL } from "../constants/apiConstants";
import { readAuthToken } from "../utils/authStorage";

export interface ChatSession {
  id: string;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

const getAuthHeaders = async () => {
  const token = await readAuthToken();
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
};

/**
 * チャットセッション一覧を取得します
 */
export async function getChatSessions(): Promise<ChatSession[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_FULL_BASE_URL}/chatbot/sessions`, { headers });
  if (!response.ok) throw new Error("Failed to fetch sessions");
  return response.json();
}

/**
 * 新しいチャットセッションを作成します
 */
export async function createChatSession(title: string = "新しいチャット"): Promise<ChatSession> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_FULL_BASE_URL}/chatbot/sessions`, {
    method: "POST",
    headers,
    body: JSON.stringify({ title }),
  });
  if (!response.ok) throw new Error("Failed to create session");
  return response.json();
}

/**
 * 特定のセッションのメッセージ履歴を取得します
 */
export async function getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_FULL_BASE_URL}/chatbot/sessions/${sessionId}`, { headers });
  if (!response.ok) throw new Error("Failed to fetch session messages");
  return response.json();
}

export const API_BASE_URL = API_FULL_BASE_URL;
