import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import apiClient from "../../services/api";

export function QRScreen({ route }: any) {
  const { meetRequestId } = route.params;
  const [qrCode, setQrCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerateQR = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/meets/${meetRequestId}/qr`);
      setQrCode(response.data.qrCode);
    } catch (error) {
      Alert.alert("エラー", "QRコード生成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyQR = async () => {
    try {
      setLoading(true);
      await apiClient.post(`/meets/${meetRequestId}/verify-qr`);
      Alert.alert("成功", "QR確認が完了しました");
    } catch (error) {
      Alert.alert("エラー", "QR確認に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>QR確認</Text>

      {qrCode ? (
        <View style={styles.qrContainer}>
          <Text style={styles.qrCode}>{qrCode}</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleGenerateQR}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? "生成中..." : "QRコード生成"}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.button, styles.verifyButton, loading && styles.buttonDisabled]}
        onPress={handleVerifyQR}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? "確認中..." : "QR確認"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  qrCode: {
    fontSize: 18,
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#e74c3c",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
    width: "100%",
  },
  verifyButton: {
    backgroundColor: "#27ae60",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
