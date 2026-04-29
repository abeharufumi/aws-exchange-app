import { createThemeStyles } from "./createThemeStyles";

export const homeStyles = createThemeStyles({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    justifyContent: "center",
  },
  cardArea: {
    flex: 1,
    justifyContent: "center",
  },
  cardContainer: {
    position: "relative",
    height: 320,
    justifyContent: "center",
  },
  card: {
    position: "absolute",
    width: "100%",
    borderRadius: 16,
    padding: 24,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardNext: {
    transform: [{ scale: 0.96 }],
    opacity: 0.7,
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111",
  },
  userInfo: {
    fontSize: 16,
    color: "#666",
  },
  userMeta: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
    marginBottom: 6,
  },
  requestStatusText: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  requestPendingText: {
    color: "#b45309",
  },
  requestMatchedText: {
    color: "#166534",
  },
  requestDefaultText: {
    color: "#6b7280",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginTop: 12,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  passButton: {
    backgroundColor: "#3a3a3a",
  },
  likeButton: {
    backgroundColor: "#e74c3c",
  },
  likeButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  actionButtonText: {
    fontSize: 24,
    color: "#fff",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  emptyStateContainer: {
    paddingVertical: 0,
  },
  emptyText: {
    fontSize: 18,
    color: "#fff",
  },
  button: {
    backgroundColor: "#e74c3c",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  reloadButton: {
    flex: 0,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
