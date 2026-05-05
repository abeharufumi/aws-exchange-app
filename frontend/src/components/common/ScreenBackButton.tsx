import React from "react";
import { StyleProp, Text, TextStyle, TouchableOpacity, ViewStyle } from "react-native";

type ScreenBackButtonProps = {
  onPress: () => void;
  variant?: "light" | "dark";
  compact?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function ScreenBackButton({
  onPress,
  variant = "light",
  compact = false,
  disabled = false,
  style,
  textStyle,
}: ScreenBackButtonProps) {
  const textColor = variant === "dark" ? "#9ca3af" : "#111827";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[
        {
          alignSelf: "flex-start",
          minWidth: 32,
          minHeight: 32,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: compact ? 0 : 2,
        },
        compact && { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          { fontSize: 24, fontWeight: "700", color: textColor, lineHeight: 24 },
          compact && { fontSize: 24, fontWeight: "700", lineHeight: 24 },
          textStyle,
        ]}
      >
        {"<"}
      </Text>
    </TouchableOpacity>
  );
}
