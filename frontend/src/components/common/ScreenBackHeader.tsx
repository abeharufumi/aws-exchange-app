import React from "react";
import { StyleProp, Text, TextStyle, View, ViewStyle } from "react-native";
import { ScreenBackButton } from "./ScreenBackButton";

type ScreenBackHeaderProps = {
  title: string;
  subtitle?: string;
  onPress: () => void;
  variant?: "light" | "dark";
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
};

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
