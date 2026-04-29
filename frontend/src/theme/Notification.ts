import { createThemeStyles } from "./createThemeStyles";

export const notificationStyles = createThemeStyles({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  summaryRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  summaryCard: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fdba74",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 120,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#9a3412",
    fontWeight: "600",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    color: "#c2410c",
    fontWeight: "800",
  },
  markAllButton: {
    alignSelf: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f1f1f1",
    marginBottom: 10,
  },
  markAllButtonText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "600",
  },
  notificationItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    borderRadius: 10,
    marginBottom: 8,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  notificationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  notificationBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  defaultBadge: {
    backgroundColor: "#6b7280",
  },
  meetRequestBadge: {
    backgroundColor: "#2563eb",
  },
  likeBadge: {
    backgroundColor: "#2563eb",
  },
  matchBadge: {
    backgroundColor: "#16a34a",
  },
  meetCompletedBadge: {
    backgroundColor: "#16a34a",
  },
  meetTroubleBadge: {
    backgroundColor: "#dc2626",
  },
  rankPenaltyBadge: {
    backgroundColor: "#7c3aed",
  },
  reviewBadge: {
    backgroundColor: "#ea580c",
  },
  matchExpiredBadge: {
    backgroundColor: "#b45309",
  },
  giftBadge: {
    backgroundColor: "#ec4899",
  },
  tipBadge: {
    backgroundColor: "#f59e0b",
  },
  fanclubBadge: {
    backgroundColor: "#7c3aed",
  },
  unreadItem: {
    backgroundColor: "#fff8f8",
    borderLeftWidth: 4,
    borderLeftColor: "#e74c3c",
  },
  readItem: {
    backgroundColor: "#fafafa",
    opacity: 0.78,
  },
  notificationText: {
    fontSize: 16,
    marginBottom: 5,
  },
  counterpartText: {
    fontSize: 12,
    color: "#374151",
    marginBottom: 6,
    fontWeight: "500",
  },
  actionButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
    flexWrap: "wrap",
  },
  profileButton: {
    alignSelf: "flex-start",
    backgroundColor: "#334155",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  profileButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  relikeButton: {
    alignSelf: "flex-start",
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  relikeButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#999",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  meetSection: {
    marginBottom: 12,
  },
  meetSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    color: "#222",
  },
  meetCard: {
    backgroundColor: "#f8fbff",
    borderWidth: 1,
    borderColor: "#dbeafe",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  meetText: {
    fontSize: 14,
    color: "#1f2937",
  },
  chatLinkButton: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  chatLinkButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  meetActionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  meetActionButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  acceptButton: {
    backgroundColor: "#16a34a",
  },
  rejectButton: {
    backgroundColor: "#dc2626",
  },
  meetActionButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  meetStatusText: {
    marginTop: 8,
    color: "#374151",
    fontSize: 13,
    fontWeight: "600",
  },
});
