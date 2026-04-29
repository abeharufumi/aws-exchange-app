import { RankProgress } from "../types/profile";

export function formatRankProgressLabel(progress?: RankProgress | null): string | null {
  if (!progress || progress.isMaxRank || !progress.items?.length) {
    return null;
  }

  const pendingItem = progress.items.find((item) => !item.done);
  const targetItem = pendingItem || progress.items[0];
  if (!targetItem) {
    return null;
  }

  const unit = targetItem.unit || "";
  return `${targetItem.label} ${targetItem.currentValue}${unit}/${targetItem.requiredValue}${unit}`;
}
