import React from "react";
import { StyleProp, TextStyle, View, ViewStyle } from "react-native";
import { Button } from "react-native-paper";

type SegmentedTabItem<T extends string> = {
  key: T;
  label: string;
};

type SegmentedTabProps<T extends string> = {
  items: readonly SegmentedTabItem<T>[];
  value: T;
  onChange: (next: T) => void;
  containerStyle?: StyleProp<ViewStyle>;
  itemStyle?: StyleProp<ViewStyle>;
  activeItemStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  activeTextStyle?: StyleProp<TextStyle>;
};

export function SegmentedTab<T extends string>({
  items,
  value,
  onChange,
  containerStyle,
  itemStyle,
  activeItemStyle,
  textStyle,
  activeTextStyle,
}: SegmentedTabProps<T>) {
  return (
    <View style={[{ flexDirection: "row", gap: 8 }, containerStyle]}>
      {items.map((item) => {
        const active = item.key === value;
        return (
          <Button
            key={item.key}
            mode={active ? "contained" : "outlined"}
            buttonColor={active ? "#2563eb" : undefined}
            textColor={active ? "#ffffff" : "#374151"}
            style={[{ flex: 1 }, itemStyle, active && activeItemStyle]}
            labelStyle={[{ fontSize: 13, fontWeight: "600" }, textStyle, active && activeTextStyle]}
            onPress={() => onChange(item.key)}
          >
            {item.label}
          </Button>
        );
      })}
    </View>
  );
}
