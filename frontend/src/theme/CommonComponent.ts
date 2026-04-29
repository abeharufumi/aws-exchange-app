import { createThemeStyles } from "./createThemeStyles";

export const commonComponentStyles = createThemeStyles({
  actionButtonRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  actionButtonPrimary: {
    backgroundColor: "#2563eb",
  },
  actionButtonSecondary: {
    backgroundColor: "#4b5563",
  },
  actionButtonDanger: {
    backgroundColor: "#e74c3c",
  },
  actionButtonNeutral: {
    backgroundColor: "#374151",
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  backButtonLightText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
  },
  backButtonDarkText: {
    color: "#9ca3af",
    fontSize: 16,
    fontWeight: "600",
  },
  backButtonCompact: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 0,
  },
  backButtonCompactText: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 24,
  },
});
