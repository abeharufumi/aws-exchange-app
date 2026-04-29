import React from "react";
import { StyleProp, TextStyle, ViewStyle } from "react-native";
import { Button } from "react-native-paper";

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
    <Button
      mode="text"
      compact={compact}
      textColor={textColor}
      style={[{ alignSelf: "flex-start" }, style]}
      contentStyle={compact ? { width: 32, height: 32 } : { paddingVertical: 4 }}
      labelStyle={[
        { fontSize: 16, fontWeight: "600" },
        compact && { fontSize: 24, fontWeight: "700", lineHeight: 24 },
        textStyle,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {compact ? compactLabel : label}
    </Button>
  );
}
