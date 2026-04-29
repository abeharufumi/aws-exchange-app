import React from "react";
import { StyleProp, TextStyle, ViewStyle } from "react-native";
import { Surface, Text } from "react-native-paper";

type StatusInfoBoxProps = {
  message: string;
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function StatusInfoBox({ message, containerStyle, textStyle }: StatusInfoBoxProps) {
  return (
    <Surface elevation={0} style={containerStyle}>
      <Text style={textStyle}>{message}</Text>
    </Surface>
  );
}
