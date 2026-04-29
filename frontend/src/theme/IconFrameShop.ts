import { createThemeStyles } from "./createThemeStyles";

export const iconFrameShopStyles = createThemeStyles({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#fff",
    paddingTop: 20,
    paddingBottom: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#e74c3c",
  },
  tabText: {
    fontSize: 14,
    color: "#9ca3af",
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#e74c3c",
    fontWeight: "700",
  },
  listContent: {
    padding: 12,
  },
  frameCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  frameCardEquipped: {
    borderColor: "#e74c3c",
    borderWidth: 2,
  },
  frameIconArea: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  frameIconText: {
    fontSize: 36,
  },
  frameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  frameInfo: {
    flex: 1,
  },
  frameName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  frameDescription: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 6,
  },
  rarityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 6,
  },
  rarityCommon: {
    backgroundColor: "#e5e7eb",
  },
  rarityRare: {
    backgroundColor: "#dbeafe",
  },
  rarityEpic: {
    backgroundColor: "#ede9fe",
  },
  rarityLegendary: {
    backgroundColor: "#fef9c3",
  },
  rarityText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  rarityTextCommon: {
    color: "#6b7280",
  },
  rarityTextRare: {
    color: "#2563eb",
  },
  rarityTextEpic: {
    color: "#7c3aed",
  },
  rarityTextLegendary: {
    color: "#d97706",
  },
  priceText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#e74c3c",
  },
  freeBadge: {
    fontSize: 13,
    fontWeight: "700",
    color: "#10b981",
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  purchaseButton: {
    flex: 1,
    backgroundColor: "#e74c3c",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  purchaseButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  equipButton: {
    flex: 1,
    backgroundColor: "#1f2937",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  equipButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  equippedBadge: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  equippedBadgeText: {
    color: "#9ca3af",
    fontWeight: "700",
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyText: {
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 14,
    paddingTop: 40,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backButtonText: {
    fontSize: 15,
    color: "#e74c3c",
    fontWeight: "600",
  },
});
