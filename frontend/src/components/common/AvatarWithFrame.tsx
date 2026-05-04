import React from "react";
import { Image, Text, View } from "react-native";

interface AvatarWithFrameProps {
  avatarUrl?: string;
  /** 装備中のフレームのレアリティ（リングカラーの決定に使用） */
  iconFrameRarity?: string;
  /** 装備中のフレーム名（未使用・将来拡張用） */
  iconFrameName?: string;
  size?: number;
  /** アバター未設定時の表示イニシャル */
  initials?: string;
}

/** レアリティに応じたドーナツリングの色設定 */
const RARITY_RING: Record<string, { color: string; width: number; glow?: string }> = {
  common: { color: "#9ca3af", width: 3 },
  uncommon: { color: "#10b981", width: 3 },
  rare: { color: "#3b82f6", width: 4 },
  epic: { color: "#8b5cf6", width: 4 },
  legendary: { color: "#f59e0b", width: 5 },
};

/**
 * アイコンフレームをボーダーリングとしてアバター画像の周囲に表示する共通コンポーネント。
 * avatarUrl が未設定の場合はイニシャルまたは👤のプレースホルダーを表示する。
 * iconFrameRarity がある場合はレアリティに対応したカラーリングを表示する。
 */
export function AvatarWithFrame({
  avatarUrl,
  iconFrameRarity,
  size = 80,
  initials,
}: AvatarWithFrameProps) {
  const ring = iconFrameRarity ? (RARITY_RING[iconFrameRarity] ?? RARITY_RING.common) : null;
  // リングがある場合、内側のアバターはリング幅+ギャップ分だけ小さくする
  const gap = ring ? 3 : 0;
  const innerSize = ring ? size - (ring.width + gap) * 2 : size;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        ...(ring
          ? {
              borderWidth: ring.width,
              borderColor: ring.color,
              // 二重リング風に見せるための内側の白ギャップ
              padding: gap,
              backgroundColor: "#ffffff",
            }
          : {}),
      }}
    >
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            backgroundColor: "#f3f4f6",
          }}
        />
      ) : (
        <View
          style={{
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            backgroundColor: "#e5e7eb",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: innerSize * 0.4, color: "#9ca3af" }}>{initials || "👤"}</Text>
        </View>
      )}
    </View>
  );
}
