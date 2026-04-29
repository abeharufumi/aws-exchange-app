import React from "react";
import { List, Switch } from "react-native-paper";

type ReceiveFilterToggleProps = {
  label: string;
  value: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function ReceiveFilterToggle({
  label,
  value,
  disabled = false,
  onPress,
}: ReceiveFilterToggleProps) {
  return (
    <List.Item
      title={label}
      titleStyle={{ fontSize: 13, fontWeight: "600", color: "#374151" }}
      style={{ borderRadius: 8, backgroundColor: "#f3f4f6" }}
      right={() => (
        <Switch
          value={value}
          disabled={disabled}
          onValueChange={onPress}
          color="#2563eb"
        />
      )}
      disabled={disabled}
      onPress={onPress}
    />
  );
}
