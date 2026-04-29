import React from "react";
import { StyleProp, TextStyle, ViewStyle } from "react-native";
import { Button } from "react-native-paper";

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
  const buttonColor =
    variant === "secondary"
      ? "#6b7280"
      : variant === "danger"
        ? "#dc2626"
        : variant === "neutral"
          ? "#374151"
          : "#2563eb";

  return (
    <Button
      mode="contained"
      buttonColor={buttonColor}
      textColor="#ffffff"
      style={[{ flex: 1, borderRadius: 10 }, disabled && { opacity: 0.6 }, style]}
      contentStyle={{ paddingVertical: 2 }}
      labelStyle={[{ fontSize: 14, fontWeight: "700" }, textStyle]}
      onPress={onPress}
      disabled={disabled}
    >
      {label}
    </Button>
  );
}
