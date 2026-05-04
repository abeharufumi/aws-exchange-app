// API 接続先ベース URL（auth.tsx と api.ts で共有）
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8000";
export const API_BASE_PATH = "/api";
export const API_FULL_BASE_URL = `${API_BASE_URL}${API_BASE_PATH}`;
