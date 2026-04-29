import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { Surface } from "react-native-paper";

type ActionButtonRowProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function ActionButtonRow({ children, style }: ActionButtonRowProps) {
  return (
    <Surface elevation={0} style={[{ flexDirection: "row" as const, gap: 10 }, style]}>
      {children}
    </Surface>
  );
}
