import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AuthErrorResponse, AuthLogoutResponse, AuthTokenResponse, AuthUser } from "../types/auth";
import { clearAuth, persistAuth, readAuthToken, readAuthUser } from "../utils/authStorage";
import { API_BASE_URL } from "../constants/apiConstants";

/**
 * 認証コンテキストの型定義
 */
interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, gender: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  isSignedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 認証プロバイダーコンポーネント
 * アプリ全体で認証状態を管理
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 起動時に保存されたトークンを復元
  useEffect(() => {
    const restoreToken = async () => {
      try {
        const savedToken = await readAuthToken();
        const savedUser = await readAuthUser();

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error("Failed to restore token:", error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreToken();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as AuthErrorResponse;
        throw new Error(error.detail || "Login failed");
      }

      const data = (await response.json()) as AuthTokenResponse;

      const newToken = data.access_token;
      const userData: AuthUser = {
        id: data.user.id,
        email: data.user.email,
        gender: data.user.gender,
        displayName: data.user.displayName,
        avatarUrl: data.user.avatarUrl,
      };

      setToken(newToken);
      setUser(userData);

      // トークンとユーザー情報を保存
      await persistAuth(newToken, JSON.stringify(userData));
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, gender: string, displayName: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          gender,
          display_name: displayName,
        }),
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as AuthErrorResponse;
        throw new Error(error.detail || "Signup failed");
      }

      const data = (await response.json()) as AuthTokenResponse;
      const newToken = data.access_token;
      const userData: AuthUser = {
        id: data.user.id,
        email: data.user.email,
        gender: data.user.gender,
        displayName: data.user.displayName,
        avatarUrl: data.user.avatarUrl,
      };

      setToken(newToken);
      setUser(userData);

      // トークンとユーザー情報を保存
      await persistAuth(newToken, JSON.stringify(userData));
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // オプション: バックエンドにログアウト通知
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
          .then(async (response) => {
            if (!response.ok) {
              return;
            }
            await response.json().catch(() => ({}) as AuthLogoutResponse);
          })
          .catch(() => {
            // ネットワークエラーは無視
          });
      }

      setToken(null);
      setUser(null);
      await clearAuth();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    signup,
    logout,
    isSignedIn: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * 認証コンテキストを使用するカスタムフック
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
