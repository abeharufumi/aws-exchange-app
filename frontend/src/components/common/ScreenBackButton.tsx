import React from "react";
import { StyleProp, Text, TextStyle, TouchableOpacity, ViewStyle } from "react-native";

type ScreenBackButtonProps = {
  onPress: () => void;
  label?: string;
  variant?: "light" | "dark";
  compact?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function ScreenBackButton({
  onPress,
  label = "← 戻る",
  variant = "light",
  compact = false,
  disabled = false,
  style,
  textStyle,
}: ScreenBackButtonProps) {
  const textColor = variant === "dark" ? "#9ca3af" : "#111827";
  const compactLabel = label === "← 戻る" ? "<" : label;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[
        { alignSelf: "flex-start", paddingVertical: compact ? 0 : 4 },
        compact && { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          { fontSize: 16, fontWeight: "600", color: textColor },
          compact && { fontSize: 24, fontWeight: "700", lineHeight: 24 },
          textStyle,
        ]}
      >
        {compact ? compactLabel : label}
      </Text>
    </TouchableOpacity>
  );
}
