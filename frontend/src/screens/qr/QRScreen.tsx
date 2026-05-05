import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  Modal,
  Platform,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
import { ScreenBackHeader } from "../../components/common/ScreenBackHeader";
import apiClient from "../../services/api";
import {
  MeetTroubleActionResponse,
  QRInfoResponse,
  QRMeetCenterResponse,
  QRVerifyResponse,
} from "../../types/meet";

type CurrentPosition = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
};

type MeetCenter = QRMeetCenterResponse;

type ApiDetail =
  | string
  | {
      code?: string;
      distance_meters?: number;
      allowed_radius_meters?: number;
    };

const calculateDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const earthRadius = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

const buildQrImageUrl = (token: string): string => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(token)}`;
};

export function QRScreen({ route }: any) {
  const router = useRouter();
  const meetRequestId = Number(route?.params?.meetRequestId);
  const hasAutoReturnedRef = useRef(false);
  const [qrCode, setQrCode] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [role, setRole] = useState<"sender" | "receiver" | "unknown">("unknown");
  const [status, setStatus] = useState<
    "accepted" | "completed" | "cancelled" | "reported" | "unknown"
  >("unknown");
  const [qrEnabled, setQrEnabled] = useState(false);
  const [expiresInSeconds, setExpiresInSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [meetCenter, setMeetCenter] = useState<MeetCenter | null>(null);
  const [allowedRadiusMeters, setAllowedRadiusMeters] = useState(500);
  const [currentDistanceMeters, setCurrentDistanceMeters] = useState<number | null>(null);
  const [positionAccuracyMeters, setPositionAccuracyMeters] = useState<number | null>(null);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const showLocationRetryAlert = (retryAction: () => void) => {
    Alert.alert("位置情報エラー", "位置情報の取得に失敗しました。再試行してください", [
      { text: "キャンセル", style: "cancel" },
      { text: "再試行", onPress: retryAction },
    ]);
  };

  const parseApiDetail = (error: any): ApiDetail => {
    return (error as any)?.response?.data?.detail;
  };

  const getCurrentPosition = useCallback(async (): Promise<CurrentPosition> => {
    return new Promise((resolve, reject) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        reject(new Error("geolocation_not_supported"));
        return;
      }

      let settled = false;
      const forceTimeout = setTimeout(() => {
        if (settled) {
          return;
        }
        settled = true;
        reject(new Error("geolocation_timeout"));
      }, 10000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (settled) {
            return;
          }
          settled = true;
          clearTimeout(forceTimeout);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracyMeters: position.coords.accuracy,
          });
        },
        () => {
          if (settled) {
            return;
          }
          settled = true;
          clearTimeout(forceTimeout);
          reject(new Error("geolocation_failed"));
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
        },
      );
    });
  }, []);

  const updateDistanceFromCurrentPosition = useCallback(
    async (silent: boolean = false) => {
      if (!meetCenter) {
        return;
      }

      try {
        const currentPosition = await getCurrentPosition();
        const distance = calculateDistanceMeters(
          currentPosition.latitude,
          currentPosition.longitude,
          meetCenter.latitude,
          meetCenter.longitude,
        );
        setCurrentDistanceMeters(Math.round(distance));
        setPositionAccuracyMeters(
          typeof currentPosition.accuracyMeters === "number"
            ? Math.round(currentPosition.accuracyMeters)
            : null,
        );
      } catch {
        if (!silent) {
          Alert.alert("位置情報エラー", "現在地の取得に失敗しました");
        }
      }
    },
    [getCurrentPosition, meetCenter],
  );

  const fetchQrInfo = useCallback(
    async (refreshToken: boolean = false, silentOnError: boolean = false) => {
      if (!Number.isFinite(meetRequestId)) {
        Alert.alert("エラー", "不正なデートIDです");
        return;
      }

      try {
        setLoading(true);
        let currentPosition: CurrentPosition | null = null;
        try {
          currentPosition = await getCurrentPosition();
        } catch {
          currentPosition = null;
        }

        const response = await apiClient.get<QRInfoResponse>(`/meet/${meetRequestId}/qr`, {
          params: {
            ...(refreshToken ? { refresh: true } : {}),
            ...(currentPosition
              ? {
                  latitude: currentPosition.latitude,
                  longitude: currentPosition.longitude,
                  accuracy_meters: currentPosition.accuracyMeters,
                }
              : {}),
          },
        });
        const qrInfo = response.data;
        setRole((qrInfo?.role || "unknown") as "sender" | "receiver" | "unknown");
        setStatus(
          (qrInfo?.status || "unknown") as
            | "accepted"
            | "completed"
            | "cancelled"
            | "reported"
            | "unknown",
        );
        setQrEnabled(Boolean(qrInfo?.qr_enabled));
        setQrCode(qrInfo?.qr_token || "");
        setExpiresInSeconds(Number(qrInfo?.expires_in_seconds || 0));
        const center = qrInfo?.meet_center;
        if (center?.latitude && center?.longitude) {
          setMeetCenter({
            latitude: Number(center.latitude),
            longitude: Number(center.longitude),
          });
          if (currentPosition) {
            const distance = calculateDistanceMeters(
              currentPosition.latitude,
              currentPosition.longitude,
              Number(center.latitude),
              Number(center.longitude),
            );
            setCurrentDistanceMeters(Math.round(distance));
          } else {
            setCurrentDistanceMeters(null);
          }
        }
        setAllowedRadiusMeters(Number(qrInfo?.required_radius_meters || 500));
        setPositionAccuracyMeters(
          currentPosition && typeof currentPosition.accuracyMeters === "number"
            ? Math.round(currentPosition.accuracyMeters)
            : null,
        );
      } catch (error) {
        if (silentOnError) {
          return;
        }
        if ((error as Error)?.message === "geolocation_not_supported") {
          Alert.alert("非対応", "この環境では位置情報が利用できません");
          return;
        }
        if ((error as Error)?.message === "geolocation_failed") {
          showLocationRetryAlert(() => {
            fetchQrInfo(refreshToken);
          });
          return;
        }
        if ((error as Error)?.message === "geolocation_timeout") {
          showLocationRetryAlert(() => {
            fetchQrInfo(refreshToken);
          });
          return;
        }
        const detail = parseApiDetail(error);
        if (
          detail === "Outside allowed area" ||
          (typeof detail === "object" && detail?.code === "Outside allowed area")
        ) {
          const distanceMeters =
            typeof detail === "object" ? Number(detail?.distance_meters || 0) : null;
          const allowedRadius =
            typeof detail === "object" ? Number(detail?.allowed_radius_meters || 500) : 500;
          Alert.alert(
            "エリア外",
            distanceMeters
              ? `現在地は待ち合わせ地点から約${distanceMeters}mです。${allowedRadius}m圏内で再試行してください`
              : `待ち合わせ地点の${allowedRadius}m圏内でQRを取得してください`,
          );
          return;
        }
        if (detail === "Location is required") {
          Alert.alert("位置情報が必要です", "位置情報の利用を許可してから再試行してください");
          return;
        }
        Alert.alert("エラー", "QR情報の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    },
    [getCurrentPosition, meetRequestId],
  );

  useEffect(() => {
    fetchQrInfo();
  }, [fetchQrInfo]);

  useEffect(() => {
    if (status !== "completed" || hasAutoReturnedRef.current) {
      return;
    }

    hasAutoReturnedRef.current = true;
    const timer = setTimeout(() => {
      router.back();
    }, 1200);

    return () => clearTimeout(timer);
  }, [router, status]);

  useEffect(() => {
    if (status !== "accepted" || expiresInSeconds <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setExpiresInSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [status, expiresInSeconds]);

  useEffect(() => {
    if (!meetCenter || status !== "accepted") {
      return;
    }

    const timer = setInterval(() => {
      updateDistanceFromCurrentPosition(true);
    }, 10000);

    return () => clearInterval(timer);
  }, [meetCenter, status, updateDistanceFromCurrentPosition]);

  // qr_enabled=false の間、30秒ごとに自動ポーリングして有効化を検知する
  useEffect(() => {
    if (status !== "accepted" || qrEnabled) {
      return;
    }

    const timer = setInterval(() => {
      fetchQrInfo(false, true);
    }, 30000);

    return () => clearInterval(timer);
  }, [status, qrEnabled, fetchQrInfo]);

  useEffect(() => {
    if (status !== "accepted") {
      return;
    }

    const timer = setInterval(() => {
      fetchQrInfo(false, true);
    }, 3000);

    return () => clearInterval(timer);
  }, [status, fetchQrInfo]);

  const executeVerifyQR = useCallback(
    async (token: string) => {
      try {
        setLoading(true);
        const currentPosition = await getCurrentPosition();
        const response = await apiClient.post<QRVerifyResponse>(`/meet/verify`, {
          request_id: meetRequestId,
          token,
          latitude: currentPosition.latitude,
          longitude: currentPosition.longitude,
          accuracy_meters: currentPosition.accuracyMeters,
        });
        setStatus("completed");
        Alert.alert("完了", response.data?.message || "デートのQR確認が完了しました");
      } catch (error) {
        if ((error as Error)?.message === "geolocation_not_supported") {
          Alert.alert("非対応", "この環境では位置情報が利用できません");
          return;
        }
        if ((error as Error)?.message === "geolocation_failed") {
          showLocationRetryAlert(() => {
            executeVerifyQR(token);
          });
          return;
        }
        if ((error as Error)?.message === "geolocation_timeout") {
          showLocationRetryAlert(() => {
            executeVerifyQR(token);
          });
          return;
        }
        const detail = parseApiDetail(error);
        if (detail === "QR is not active yet") {
          Alert.alert("まだ利用できません", "約束時刻になるとQR確認が可能になります");
          return;
        }
        if (detail === "QR token expired") {
          Alert.alert(
            "期限切れ",
            "QRトークンの有効期限が切れました。相手に更新してもらってください",
          );
          return;
        }
        if (
          detail === "Outside allowed area" ||
          (typeof detail === "object" && detail?.code === "Outside allowed area")
        ) {
          const distanceMeters =
            typeof detail === "object" ? Number(detail?.distance_meters || 0) : null;
          const allowedRadius =
            typeof detail === "object" ? Number(detail?.allowed_radius_meters || 500) : 500;
          Alert.alert(
            "エリア外",
            distanceMeters
              ? `現在地は待ち合わせ地点から約${distanceMeters}mです。${allowedRadius}m圏内でQR確認してください`
              : `待ち合わせ地点の${allowedRadius}m圏内でQR確認してください`,
          );
          return;
        }
        if (detail === "Location is required") {
          Alert.alert("位置情報が必要です", "位置情報の利用を許可してから再試行してください");
          return;
        }
        Alert.alert("エラー", "QR確認に失敗しました");
      } finally {
        setLoading(false);
      }
    },
    [getCurrentPosition, meetRequestId],
  );

  const handleTroubleAction = async (action: "cancel_agreed" | "report_noshow") => {
    const confirmMessage =
      action === "cancel_agreed"
        ? "このデート予定を合意キャンセルしますか？"
        : "相手をドタキャン報告しますか？";

    Alert.alert("確認", confirmMessage, [
      { text: "戻る", style: "cancel" },
      {
        text: "実行する",
        style: action === "report_noshow" ? "destructive" : "default",
        onPress: async () => {
          try {
            setLoading(true);
            const response = await apiClient.post<MeetTroubleActionResponse>(
              `/meet/${meetRequestId}/trouble`,
              { action },
            );
            const nextStatus = response.data?.status;
            if (nextStatus === "cancelled" || nextStatus === "reported") {
              setStatus(nextStatus);
            }
            Alert.alert(
              "完了",
              response.data?.message ||
                (action === "cancel_agreed"
                  ? "デートを合意キャンセルしました"
                  : "ドタキャン報告を送信しました"),
            );
          } catch (error) {
            const detail = parseApiDetail(error);
            if (typeof detail === "string") {
              Alert.alert("エラー", detail);
              return;
            }
            Alert.alert("エラー", "トラブル対応の送信に失敗しました");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleVerifyQR = async () => {
    const token = verifyToken.trim();
    if (!token) {
      Alert.alert("入力不足", "QRトークンを入力してください");
      return;
    }

    await executeVerifyQR(token);
  };

  const openScanner = async () => {
    if (Platform.OS === "web") {
      Alert.alert("未対応", "Webではカメラスキャン非対応です。手入力をご利用ください");
      return;
    }
    if (!qrEnabled || status === "completed") {
      Alert.alert("利用不可", "QR確認が有効になってからスキャンしてください");
      return;
    }

    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert("権限エラー", "カメラ権限を許可してください");
        return;
      }
    }

    setScanLocked(false);
    setScannerVisible(true);
  };

  const handleBarcodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (scanLocked || !data) {
      return;
    }
    setScanLocked(true);
    setScannerVisible(false);
    setVerifyToken(data);
    await executeVerifyQR(data.trim());
    setTimeout(() => setScanLocked(false), 500);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <ScreenBackHeader title="QR確認" onPress={() => router.back()} />

      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 20,
          paddingVertical: 20,
        }}
      >
        {currentDistanceMeters !== null && (
          <View
            style={{
              marginBottom: 12,
              width: "100%",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#bbf7d0",
              backgroundColor: "#f0fdf4",
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <Text style={{ textAlign: "center", fontSize: 14, fontWeight: "700" }}>
              待ち合わせ地点まで 約{currentDistanceMeters}m
            </Text>
            <Text
              style={[
                { marginTop: 4, textAlign: "center", fontSize: 12, fontWeight: "600" },
                { color: currentDistanceMeters <= allowedRadiusMeters ? "#15803d" : "#b45309" },
              ]}
            >
              {currentDistanceMeters <= allowedRadiusMeters
                ? `判定: 圏内（${allowedRadiusMeters}m以内）`
                : `判定: 圏外（${allowedRadiusMeters}m以内で有効）`}
            </Text>
            {positionAccuracyMeters !== null && (
              <Text style={{ marginTop: 4, textAlign: "center", color: "#374151" }}>
                GPS精度: ±{positionAccuracyMeters}m
              </Text>
            )}
          </View>
        )}

        {status === "completed" && (
          <View
            style={{
              marginBottom: 12,
              borderRadius: 8,
              backgroundColor: "#dcfce7",
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text style={{ fontWeight: "600", color: "#166534" }}>このデートはQR確認済みです</Text>
          </View>
        )}

        {status === "cancelled" && (
          <View
            style={{
              marginBottom: 12,
              width: "100%",
              borderRadius: 8,
              backgroundColor: "#f3f4f6",
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text style={{ textAlign: "center", fontWeight: "600", color: "#374151" }}>
              このデートは合意キャンセル済みです
            </Text>
          </View>
        )}

        {status === "reported" && (
          <View
            style={{
              marginBottom: 12,
              width: "100%",
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#fecaca",
              backgroundColor: "#fef2f2",
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text style={{ textAlign: "center", fontWeight: "600" }}>
              このデートはドタキャン報告済みです
            </Text>
          </View>
        )}

        {status === "accepted" && !qrEnabled && (
          <View
            style={{
              marginBottom: 12,
              width: "100%",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#bfdbfe",
              backgroundColor: "#eff6ff",
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <Text style={{ textAlign: "center", fontWeight: "600" }}>
              約束時刻になるとQR確認が有効になります
            </Text>
          </View>
        )}

        {role === "sender" && (
          <>
            {qrEnabled ? (
              <>
                <Text style={{ marginBottom: 10, textAlign: "center", color: "#4b5563" }}>
                  このトークンを相手に読み取ってもらってください
                </Text>
                <Text style={{ marginBottom: 10, fontWeight: "600" }}>
                  有効期限: あと {expiresInSeconds} 秒
                </Text>
                <View
                  style={{
                    marginBottom: 20,
                    width: "100%",
                    alignItems: "center",
                    borderRadius: 12,
                    backgroundColor: "#f3f4f6",
                    padding: 20,
                  }}
                >
                  {qrCode ? (
                    <Image
                      source={{ uri: buildQrImageUrl(qrCode) }}
                      style={{ width: 240, height: 240, marginBottom: 10 }}
                    />
                  ) : (
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#374151" }}>
                      トークン未発行
                    </Text>
                  )}
                  <Text
                    style={{
                      textAlign: "center",
                      fontSize: 12,
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    {qrCode || "トークン未発行"}
                  </Text>
                </View>
              </>
            ) : (
              <Text style={{ marginBottom: 10, textAlign: "center", color: "#4b5563" }}>
                有効化後にQRトークンが表示されます
              </Text>
            )}
            <TouchableOpacity
              style={[
                {
                  marginBottom: 10,
                  width: "100%",
                  alignItems: "center",
                  borderRadius: 8,
                  backgroundColor: "#ef4444",
                  paddingVertical: 14,
                },
                loading ? { opacity: 0.6 } : undefined,
              ]}
              onPress={() => fetchQrInfo(true)}
              disabled={loading}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#ffffff" }}>
                {loading ? "更新中..." : "状態を更新"}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {role === "receiver" && (
          <>
            <Text style={{ marginBottom: 10, textAlign: "center", color: "#4b5563" }}>
              カメラ読み取りまたは手入力でQR確認できます
            </Text>
            <TouchableOpacity
              style={[
                {
                  marginBottom: 10,
                  width: "100%",
                  alignItems: "center",
                  borderRadius: 8,
                  backgroundColor: "#2563eb",
                  paddingVertical: 14,
                },
                loading ? { opacity: 0.6 } : undefined,
              ]}
              onPress={openScanner}
              disabled={loading || status === "completed" || !qrEnabled}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#ffffff" }}>
                カメラで読み取る
              </Text>
            </TouchableOpacity>
            <TextInput
              style={{
                marginBottom: 10,
                width: "100%",
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#d1d5db",
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: "#111827",
              }}
              value={verifyToken}
              onChangeText={setVerifyToken}
              placeholder="QRトークンを入力"
              autoCapitalize="none"
              editable={qrEnabled && status !== "completed"}
            />
            <TouchableOpacity
              style={[
                {
                  marginBottom: 10,
                  width: "100%",
                  alignItems: "center",
                  borderRadius: 8,
                  backgroundColor: "#16a34a",
                  paddingVertical: 14,
                },
                loading ? { opacity: 0.6 } : undefined,
              ]}
              onPress={handleVerifyQR}
              disabled={loading || status === "completed" || !qrEnabled}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#ffffff" }}>
                {loading ? "確認中..." : "QR確認"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                {
                  marginBottom: 10,
                  width: "100%",
                  alignItems: "center",
                  borderRadius: 8,
                  backgroundColor: "#ef4444",
                  paddingVertical: 14,
                },
                loading ? { opacity: 0.6 } : undefined,
              ]}
              onPress={() => fetchQrInfo()}
              disabled={loading}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#ffffff" }}>
                {loading ? "更新中..." : "状態を更新"}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {status === "accepted" && (
          <View style={{ marginTop: 6, width: "100%" }}>
            <TouchableOpacity
              style={[
                {
                  marginBottom: 10,
                  width: "100%",
                  alignItems: "center",
                  borderRadius: 8,
                  backgroundColor: "#6b7280",
                  paddingVertical: 14,
                },
                loading ? { opacity: 0.6 } : undefined,
              ]}
              onPress={() => handleTroubleAction("cancel_agreed")}
              disabled={loading}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#ffffff" }}>
                合意キャンセル
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                {
                  marginBottom: 10,
                  width: "100%",
                  alignItems: "center",
                  borderRadius: 8,
                  backgroundColor: "#dc2626",
                  paddingVertical: 14,
                },
                loading ? { opacity: 0.6 } : undefined,
              ]}
              onPress={() => handleTroubleAction("report_noshow")}
              disabled={loading}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#ffffff" }}>
                ドタキャン報告
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {role === "unknown" && (
          <TouchableOpacity
            style={[
              {
                marginBottom: 10,
                width: "100%",
                alignItems: "center",
                borderRadius: 8,
                backgroundColor: "#ef4444",
                paddingVertical: 14,
              },
              loading ? { opacity: 0.6 } : undefined,
            ]}
            onPress={() => fetchQrInfo()}
            disabled={loading}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#ffffff" }}>
              {loading ? "取得中..." : "QR情報を取得"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={scannerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setScannerVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 16 }}>
          <Pressable
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: "rgba(17, 24, 39, 0.24)",
            }}
            onPress={() => setScannerVisible(false)}
          />
          <View style={{ borderRadius: 12, backgroundColor: "#ffffff", padding: 14 }}>
            <Text
              style={{ textAlign: "center", fontSize: 18, fontWeight: "700", color: "#111827" }}
            >
              QRを読み取ってください
            </Text>
            <Text
              style={{
                marginBottom: 12,
                marginTop: 6,
                textAlign: "center",
                fontSize: 12,
                color: "#4b5563",
              }}
            >
              枠内に相手のQRコードを合わせてください
            </Text>
            <CameraView
              style={{
                width: "100%",
                height: 320,
                borderRadius: 10,
                overflow: "hidden",
              }}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={handleBarcodeScanned}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
