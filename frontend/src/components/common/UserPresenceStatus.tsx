import React from "react";
import { Text, View } from "react-native";
import {
  getUserPresenceColor,
  getUserPresenceText,
} from "../../utils/userPresence";

type UserPresenceStatusProps = {
  status?: string;
  lastActiveAt?: string;
  textColor?: string;
};

export function UserPresenceStatus({
  status,
  lastActiveAt,
  textColor = "#6b7280",
}: UserPresenceStatusProps) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          backgroundColor: getUserPresenceColor(status),
        }}
      />
      <Text style={{ fontSize: 12, color: textColor }}>
        {getUserPresenceText(status, lastActiveAt)}
      </Text>
    </View>
  );
}