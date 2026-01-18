import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "../services/api";

interface User {
  id: string;
  email: string;
  displayName: string;
  gender: string;
  phone: string;
  profilePicture?: string;
  age?: number;
}

interface AuthStore {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    email: string;
    password: string;
    displayName: string;
    gender: string;
    phone: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  restoreToken: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,
  isLoading: true,

  login: async (email: string, password: string) => {
    const response = await apiClient.post("/auth/login", { email, password });
    const { token, user } = response.data;
    await AsyncStorage.setItem("authToken", token);
    set({ token, user });
  },

  signup: async (data) => {
    const response = await apiClient.post("/auth/signup", data);
    const { token, user } = response.data;
    await AsyncStorage.setItem("authToken", token);
    set({ token, user });
  },

  logout: async () => {
    await AsyncStorage.removeItem("authToken");
    set({ token: null, user: null });
  },

  restoreToken: async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        set({ token });
      }
    } catch (error) {
      console.error("Token restore error:", error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
