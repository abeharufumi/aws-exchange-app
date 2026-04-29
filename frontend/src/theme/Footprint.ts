import { createThemeStyles } from "./createThemeStyles";

export const footprintStyles = createThemeStyles({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  restrictionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  restrictionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 12,
  },
  restrictionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
    marginBottom: 12,
  },
  restrictionHint: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 12,
  },
  restrictionProgressText: {
    marginBottom: 10,
    fontSize: 12,
    color: "#374151",
    fontWeight: "700",
    textAlign: "center",
  },
  rankGuideButton: {
    marginTop: 4,
    borderRadius: 8,
    backgroundColor: "#374151",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  rankGuideButtonText: {
    fontSize: 13,
    color: "#f9fafb",
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 14,
    color: "#9ca3af",
  },
  footprintItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  itemContent: {
    flex: 1,
  },
  visitorName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  viewedAt: {
    fontSize: 12,
    color: "#9ca3af",
  },
  arrowIcon: {
    fontSize: 20,
    color: "#d1d5db",
    marginLeft: 8,
  },
});
