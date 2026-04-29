import axios, { isAxiosError } from "axios";
import { readAuthToken } from "../utils/authStorage";

import { API_FULL_BASE_URL } from "../constants/apiConstants";

const apiClient = axios.create({
  baseURL: API_FULL_BASE_URL,
  timeout: 10000,
});

const stripTokenQueryFromUrl = (url?: string): string | undefined => {
  if (!url || !url.includes("token=")) {
    return url;
  }

  const [path, query = ""] = url.split("?");
  const params = new URLSearchParams(query);
  params.delete("token");
  const next = params.toString();
  return next ? `${path}?${next}` : path;
};

const isAuthFreePath = (url?: string): boolean => {
  if (!url) return false;
  return (
    url.includes("/auth/login") || url.includes("/auth/signup") || url.includes("/auth/logout")
  );
};

export const isUnauthorizedError = (error: unknown): boolean => {
  return isAxiosError(error) && error.response?.status === 401;
};

// リクエスト時にトークンを付加
apiClient.interceptors.request.use(async (config) => {
  config.url = stripTokenQueryFromUrl(config.url);

  if (config.params && typeof config.params === "object" && "token" in config.params) {
    const nextParams = { ...(config.params as Record<string, unknown>) };
    delete nextParams.token;
    config.params = nextParams;
  }

  const token = await readAuthToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  }

  if (!isAuthFreePath(config.url)) {
    return Promise.reject(new Error("AUTH_TOKEN_MISSING"));
  }

  return config;
});

export default apiClient;
