import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import { createBottomTabNavigator, BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { CompositeNavigationProp } from "@react-navigation/native";

import { useAuthStore } from "../stores/authStore";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { SignupScreen } from "../screens/auth/SignupScreen";
import { TimelineScreen } from "../screens/home/TimelineScreen";
import { SearchScreen } from "../screens/search/SearchScreen";
import { NotificationScreen } from "../screens/notification/NotificationScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { ChatScreen } from "../screens/chat/ChatScreen";
import { QRScreen } from "../screens/qr/QRScreen";
import { ReviewScreen } from "../screens/review/ReviewScreen";

export type RootStackParamList = {
  Auth: undefined;
  MainApp: undefined;
  Chat: { id: string };
  QR: { meetRequestId: string };
  Review: { meetId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Notification: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

function AuthStackNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Search") {
            iconName = focused ? "search" : "search-outline";
          } else if (route.name === "Notification") {
            iconName = focused ? "notifications" : "notifications-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#e74c3c",
        tabBarInactiveTintColor: "#999",
      })}
    >
      <Tab.Screen
        name="Home"
        component={TimelineScreen}
        options={{ title: "ホーム", tabBarLabel: "ホーム" }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: "検索", tabBarLabel: "検索" }}
      />
      <Tab.Screen
        name="Notification"
        component={NotificationScreen}
        options={{ title: "通知", tabBarLabel: "通知" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "プロフィール", tabBarLabel: "自分" }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const token = useAuthStore((state) => state.token);
  const isLoading = useAuthStore((state) => state.isLoading);
  const restoreToken = useAuthStore((state) => state.restoreToken);

  useEffect(() => {
    restoreToken();
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <>
            <Stack.Screen name="MainApp" component={MainTabNavigator} />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ headerShown: true, title: "チャット" }}
            />
            <Stack.Screen
              name="QR"
              component={QRScreen}
              options={{ headerShown: true, title: "QR確認" }}
            />
            <Stack.Screen
              name="Review"
              component={ReviewScreen}
              options={{ headerShown: true, title: "レビュー" }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStackNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
