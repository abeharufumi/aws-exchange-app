import React, { useMemo } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

type TimePickerModalProps = {
  visible: boolean;
  selectedTime: string;
  onSelectTime: (time: string) => void;
  onClose: () => void;
  title?: string;
};

export function TimePickerModal({
  visible,
  selectedTime,
  onSelectTime,
  onClose,
  title = "時刻を選択",
}: TimePickerModalProps) {
  const timeOptions = useMemo(() => {
    const options: string[] = [];
    for (let hour = 0; hour < 24; hour += 1) {
      for (let minute = 0; minute < 60; minute += 15) {
        options.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
      }
    }
    return options;
  }, []);

  const handleSelectTime = (time: string) => {
    onSelectTime(time);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
        <View style={{ borderRadius: 12, backgroundColor: "#ffffff", padding: 16 }}>
          <Text style={{ marginBottom: 12, fontSize: 16, fontWeight: "700" }}>{title}</Text>
          <ScrollView
            style={{ marginBottom: 12, maxHeight: 360 }}
            contentContainerStyle={{ paddingBottom: 4 }}
            showsVerticalScrollIndicator
          >
            {timeOptions.map((time) => {
              const selected = selectedTime === time;
              return (
                <TouchableOpacity
                  key={time}
                  style={{
                    marginBottom: 8,
                    alignItems: "center",
                    borderRadius: 8,
                    borderWidth: 1,
                    paddingVertical: 10,
                    borderColor: selected ? "#3b82f6" : "#e5e7eb",
                    backgroundColor: selected ? "#dbeafe" : "#f9fafb",
                  }}
                  onPress={() => handleSelectTime(time)}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: selected ? "#2563eb" : "#374151",
                    }}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity
            style={{
              alignItems: "center",
              borderRadius: 8,
              backgroundColor: "#9ca3af",
              paddingVertical: 10,
            }}
            onPress={onClose}
          >
            <Text style={{ color: "#ffffff", fontWeight: "700" }}>閉じる</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
