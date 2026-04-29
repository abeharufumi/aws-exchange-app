import { createThemeStyles } from "./createThemeStyles";

export const premiumSubscribeStyles = createThemeStyles({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  benefitsContainer: {
    marginBottom: 32,
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  benefitDot: {
    fontSize: 14,
    color: "#f59e0b",
    marginRight: 8,
    fontWeight: "700",
  },
  benefitText: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
  },
  plansContainer: {
    marginBottom: 32,
    gap: 12,
  },
  planCard: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#f9fafb",
    position: "relative",
  },
  planCardSelected: {
    borderColor: "#f59e0b",
    backgroundColor: "#fffbeb",
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  planLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  planLabelSelected: {
    color: "#d97706",
  },
  discountBadge: {
    backgroundColor: "#ef4444",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  planPrice: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  planPriceSelected: {
    color: "#f59e0b",
  },
  monthlyPrice: {
    fontSize: 12,
    color: "#6b7280",
  },
  monthlyPriceSelected: {
    color: "#d97706",
  },
  termsContainer: {
    marginBottom: 24,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  termsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  termsText: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
    lineHeight: 18,
  },
  subscribeButton: {
    backgroundColor: "#f59e0b",
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
});
