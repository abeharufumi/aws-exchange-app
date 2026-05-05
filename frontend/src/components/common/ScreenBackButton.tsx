import React from "react";
import { StyleProp, Text, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native";

type ScreenBackButtonProps = {
  onPress: () => void;
  variant?: "light" | "dark";
  compact?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

type ScreenBackHeaderProps = {
  title: string;
  subtitle?: string;
  onPress: () => void;
  variant?: "light" | "dark";
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
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

export function ScreenBackHeader({
  title,
  subtitle,
  onPress,
  variant = "light",
  style,
  titleStyle,
  subtitleStyle,
}: ScreenBackHeaderProps) {
  const titleColor = variant === "dark" ? "#ffffff" : "#111827";
  const subtitleColor = variant === "dark" ? "#9ca3af" : "#6b7280";

  return (
    <View
      style={[
        {
          minHeight: 64,
          borderBottomWidth: 1,
          borderColor: "#f3f4f6",
          backgroundColor: variant === "dark" ? "#1a1a1a" : "#ffffff",
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 10,
          flexDirection: "row",
          alignItems: "center",
        },
        style,
      ]}
    >
      <ScreenBackButton onPress={onPress} variant={variant} compact />
      <View style={{ marginLeft: 8, flex: 1 }}>
        <Text style={[{ fontSize: 20, fontWeight: "700", color: titleColor }, titleStyle]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[{ marginTop: 2, fontSize: 14, color: subtitleColor }, subtitleStyle]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
