import React from "react";
import { StyleProp, Text, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native";

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
    <View
      style={[
        { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
        containerStyle,
      ]}
    >
      {items.map((item) => {
        const active = item.key === value;
        return (
          <TouchableOpacity
            key={item.key}
            activeOpacity={0.85}
            style={[
              {
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 10,
                borderBottomWidth: 2,
                borderBottomColor: active ? "#7c3aed" : "transparent",
                marginBottom: -1,
              },
              itemStyle,
              active && activeItemStyle,
            ]}
            onPress={() => onChange(item.key)}
          >
            <Text
              style={[
                { fontSize: 14, fontWeight: "700", color: active ? "#7c3aed" : "#6b7280" },
                textStyle,
                active && activeTextStyle,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
