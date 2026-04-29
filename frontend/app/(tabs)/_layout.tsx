import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import apiClient, { isUnauthorizedError } from "@/src/services/api";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const [stopPolling, setStopPolling] = useState(false);

  useEffect(() => {
    if (stopPolling) {
      return;
    }

    let active = true;

    const fetchUnreadCount = async () => {
      try {
        const response = await apiClient.get("/notifications/unread-count");
        const count = Number(response.data?.unreadCount || 0);
        if (active) {
          setUnreadCount(Number.isFinite(count) ? count : 0);
        }
      } catch (error) {
        if ((error as Error)?.message === "AUTH_TOKEN_MISSING" || isUnauthorizedError(error)) {
          if (active) {
            setStopPolling(true);
            setUnreadCount(0);
          }
          return;
        }
        if (active) {
          setUnreadCount(0);
        }
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [stopPolling]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: "Matches",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="heart.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="notification"
        options={{
          title: "Notification",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="bell.fill" color={color} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.circle" color={color} />,
        }}
      />
    </Tabs>
  );
}
