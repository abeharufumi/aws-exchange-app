import React, { ReactNode } from "react";
import { StyleProp, ViewStyle } from "react-native";
import { Surface } from "react-native-paper";

type SectionCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function SectionCard({ children, style }: SectionCardProps) {
  return (
    <Surface elevation={0} style={style}>
      {children}
    </Surface>
  );
}
