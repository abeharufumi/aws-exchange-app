import { createThemeStyles } from "./createThemeStyles";

export const matchesStyles = createThemeStyles({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  item: {
    backgroundColor: "#fff5f5",
    borderWidth: 1,
    borderColor: "#ffd6d6",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  outgoingSection: {
    marginBottom: 12,
  },
  outgoingSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  incomingItem: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  incomingItemDeadlineSoon: {
    backgroundColor: "#fff7ed",
    borderColor: "#fdba74",
  },
  outgoingItem: {
    backgroundColor: "#f8fbff",
    borderWidth: 1,
    borderColor: "#dbeafe",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  incomingActionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  outgoingItemDeadlineSoon: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222",
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
  },
  activityText: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 6,
    fontWeight: "600",
  },
  bio: {
    fontSize: 14,
    color: "#444",
    marginBottom: 8,
  },
  outgoingStatusText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
    marginBottom: 6,
  },
  deadlineText: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  deadlineNormalText: {
    color: "#2563eb",
  },
  deadlineSoonText: {
    color: "#dc2626",
  },
  deadlineExpiredText: {
    color: "#7c2d12",
  },
  lastMessage: {
    fontSize: 13,
    color: "#444",
    marginBottom: 4,
  },
  lastMessageAt: {
    fontSize: 12,
    color: "#999",
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chatButton: {
    alignSelf: "flex-start",
    backgroundColor: "#e74c3c",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chatButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  relikeButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  relikeButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  passButton: {
    backgroundColor: "#6b7280",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  passButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  outgoingActionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  profileButton: {
    backgroundColor: "#6b7280",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  profileButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonTextDisabled: {
    color: "#f3f4f6",
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "#ff3b30",
    alignItems: "center",
    justifyContent: "center",
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 30,
    color: "#999",
    fontSize: 15,
  },
});
