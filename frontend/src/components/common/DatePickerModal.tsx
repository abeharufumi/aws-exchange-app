import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";

type DatePickerModalProps = {
  visible: boolean;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onClose: () => void;
  title?: string;
};

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseLocalDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

function buildCalendarCells(baseMonth: Date): (Date | null)[] {
  const year = baseMonth.getFullYear();
  const month = baseMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const leadingBlankCount = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < leadingBlankCount; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

export function DatePickerModal({
  visible,
  selectedDate,
  onSelectDate,
  onClose,
  title = "日付を選択",
}: DatePickerModalProps) {
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    if (!visible) {
      return;
    }
    const parsed = parseLocalDate(selectedDate);
    const base = parsed || new Date();
    setCalendarMonth(new Date(base.getFullYear(), base.getMonth(), 1));
  }, [visible, selectedDate]);

  const selectedDateObj = useMemo(() => parseLocalDate(selectedDate), [selectedDate]);
  const calendarCells = useMemo(() => buildCalendarCells(calendarMonth), [calendarMonth]);

  const changeCalendarMonth = (delta: number) => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const handleSelectDate = (date: Date) => {
    onSelectDate(formatLocalDate(date));
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
        <Pressable
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: "rgba(17, 24, 39, 0.24)",
          }}
          onPress={onClose}
        />
        <View style={{ borderRadius: 12, backgroundColor: "#ffffff", padding: 16 }}>
          <Text style={{ marginBottom: 10, fontSize: 16, fontWeight: "700", color: "#111827" }}>
            {title}
          </Text>
          <View
            style={{
              marginBottom: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity
              style={{
                height: 32,
                width: 32,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 9999,
                backgroundColor: "#e5e7eb",
              }}
              onPress={() => changeCalendarMonth(-1)}
            >
              <Text style={{ fontWeight: "700", color: "#374151" }}>◀</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827" }}>
              {calendarMonth.getFullYear()}年{calendarMonth.getMonth() + 1}月
            </Text>
            <TouchableOpacity
              style={{
                height: 32,
                width: 32,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 9999,
                backgroundColor: "#e5e7eb",
              }}
              onPress={() => changeCalendarMonth(1)}
            >
              <Text style={{ fontWeight: "700", color: "#374151" }}>▶</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginBottom: 8, flexDirection: "row" }}>
            {["日", "月", "火", "水", "木", "金", "土"].map((label) => (
              <Text
                key={label}
                style={{
                  width: "14.2857%",
                  textAlign: "center",
                  fontSize: 12,
                  fontWeight: "600",
                  color: "#6b7280",
                }}
              >
                {label}
              </Text>
            ))}
          </View>

          <View style={{ marginBottom: 12, flexDirection: "row", flexWrap: "wrap" }}>
            {calendarCells.map((cell, index) => {
              if (!cell) {
                return <View key={`blank-${index}`} style={{ height: 36, width: "14.2857%" }} />;
              }

              const selected =
                selectedDateObj && formatLocalDate(cell) === formatLocalDate(selectedDateObj);
              return (
                <TouchableOpacity
                  key={formatLocalDate(cell)}
                  style={{
                    height: 36,
                    width: "14.2857%",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 9999,
                    backgroundColor: selected ? "#3b82f6" : "transparent",
                  }}
                  onPress={() => handleSelectDate(cell)}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: selected ? "#ffffff" : "#111827",
                    }}
                  >
                    {cell.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}
