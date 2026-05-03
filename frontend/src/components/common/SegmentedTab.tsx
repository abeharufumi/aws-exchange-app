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
    <View style={[{ flexDirection: "row", gap: 8 }, containerStyle]}>
      {items.map((item) => {
        const active = item.key === value;
        return (
          <TouchableOpacity
            key={item.key}
            activeOpacity={0.85}
            style={[
              {
                flex: 1,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 10,
                borderWidth: active ? 0 : 1,
                borderColor: "#d1d5db",
                backgroundColor: active ? "#2563eb" : "transparent",
              },
              itemStyle,
              active && activeItemStyle,
            ]}
            onPress={() => onChange(item.key)}
          >
            <Text
              style={[
                { fontSize: 13, fontWeight: "600", color: active ? "#ffffff" : "#374151" },
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
