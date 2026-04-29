import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export const AUTH_TOKEN_KEY = "auth_token";
export const AUTH_USER_KEY = "auth_user";
export const LEGACY_AUTH_TOKEN_KEY = "authToken";

const isWeb = Platform.OS === "web" && typeof window !== "undefined";

const getItem = async (key: string): Promise<string | null> => {
  if (isWeb) {
    return window.sessionStorage.getItem(key);
  }
  return AsyncStorage.getItem(key);
};

const setItem = async (key: string, value: string): Promise<void> => {
  if (isWeb) {
    window.sessionStorage.setItem(key, value);
    return;
  }
  await AsyncStorage.setItem(key, value);
};

const removeItems = async (keys: string[]): Promise<void> => {
  if (isWeb) {
    keys.forEach((key) => window.sessionStorage.removeItem(key));
    return;
  }
  await AsyncStorage.multiRemove(keys);
};

export const readAuthToken = async (): Promise<string | null> => {
  const token = await getItem(AUTH_TOKEN_KEY);
  if (token) {
    return token;
  }

  const legacyToken = await getItem(LEGACY_AUTH_TOKEN_KEY);
  if (legacyToken) {
    await setItem(AUTH_TOKEN_KEY, legacyToken);
    await removeItems([LEGACY_AUTH_TOKEN_KEY]);
  }
  return legacyToken;
};

export const readAuthUser = async (): Promise<string | null> => {
  return getItem(AUTH_USER_KEY);
};

export const persistAuth = async (token: string, userJson: string): Promise<void> => {
  await Promise.all([setItem(AUTH_TOKEN_KEY, token), setItem(AUTH_USER_KEY, userJson)]);
};

export const clearAuth = async (): Promise<void> => {
  await removeItems([AUTH_TOKEN_KEY, AUTH_USER_KEY, LEGACY_AUTH_TOKEN_KEY]);
};
