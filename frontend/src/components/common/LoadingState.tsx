import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { ActivityIndicator, Surface } from "react-native-paper";

type LoadingStateProps = {
  color?: string;
  size?: "small" | "large";
  containerStyle?: StyleProp<ViewStyle>;
};

export function LoadingState({
  color = "#2563eb",
  size = "large",
  containerStyle,
}: LoadingStateProps) {
  return (
    <Surface
      elevation={0}
      style={[{ flex: 1, justifyContent: "center", alignItems: "center" }, containerStyle]}
    >
      <ActivityIndicator size={size} color={color} />
    </Surface>
  );
}
