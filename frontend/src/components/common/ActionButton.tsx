import React from "react";
import { StyleProp, Text, TextStyle, TouchableOpacity, ViewStyle } from "react-native";

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "neutral";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function ActionButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  style,
  textStyle,
}: ActionButtonProps) {
  const backgroundColor =
    variant === "secondary"
      ? "#6b7280"
      : variant === "danger"
        ? "#dc2626"
        : variant === "neutral"
          ? "#374151"
          : "#2563eb";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[
        {
          flex: 1,
          borderRadius: 10,
          paddingVertical: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor,
        },
        disabled && { opacity: 0.6 },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[{ color: "#ffffff", fontSize: 14, fontWeight: "700" }, textStyle]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
