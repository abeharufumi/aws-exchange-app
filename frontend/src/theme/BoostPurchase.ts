import { createThemeStyles } from "./createThemeStyles";

export const boostPurchaseStyles = createThemeStyles({
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
    borderColor: "#f97316",
    backgroundColor: "#fff7ed",
  },
  planLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  planLabelSelected: {
    color: "#ea580c",
  },
  planPrice: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
  },
  planPriceSelected: {
    color: "#f97316",
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    right: 8,
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
  benefitsContainer: {
    marginBottom: 32,
    backgroundColor: "#f0f9ff",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#0284c7",
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
    color: "#16a34a",
    marginRight: 8,
    fontWeight: "700",
  },
  benefitText: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
  },
  purchaseButton: {
    backgroundColor: "#f97316",
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
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
