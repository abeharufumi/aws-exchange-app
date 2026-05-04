import React from "react";
import { Image, Text, View } from "react-native";

interface AvatarWithFrameProps {
  avatarUrl?: string;
  iconFrameImageUrl?: string;
  size?: number;
  /** アバター未設定時の表示イニシャル */
  initials?: string;
}

/**
 * アイコンフレームをアバター画像に重ねて表示する共通コンポーネント。
 * avatarUrl が未設定の場合はプレースホルダー（イニシャルまたは👤）を表示する。
 * iconFrameImageUrl がある場合はアバターの上にフレームをオーバーレイする。
 */
export function AvatarWithFrame({
  avatarUrl,
  iconFrameImageUrl,
  size = 80,
  initials,
}: AvatarWithFrameProps) {
  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      {/* アバター本体 */}
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: "#f3f4f6",
          }}
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: "#e5e7eb",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: size * 0.4, color: "#9ca3af" }}>
            {initials || "👤"}
          </Text>
        </View>
      )}

      {/* フレームオーバーレイ（装備中のアイコンフレーム） */}
      {iconFrameImageUrl && (
        <Image
          source={{ uri: iconFrameImageUrl }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: size,
            height: size,
          }}
          resizeMode="contain"
        />
      )}
    </View>
  );
}
