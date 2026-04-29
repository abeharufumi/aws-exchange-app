import React from "react";
import { StyleProp, TextStyle, ViewStyle } from "react-native";
import { Surface, Text } from "react-native-paper";

type EmptyStateProps = {
  message: string;
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function EmptyState({ message, containerStyle, textStyle }: EmptyStateProps) {
  return (
    <Surface
      elevation={0}
      style={[
        {
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: 24,
          paddingHorizontal: 16,
        },
        containerStyle,
      ]}
    >
      <Text style={[{ fontSize: 14, color: "#6b7280", textAlign: "center" }, textStyle as any]}>
        {message}
      </Text>
    </Surface>
  );
}
