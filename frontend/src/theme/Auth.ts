import { createThemeStyles } from "./createThemeStyles";

export const authStyles = createThemeStyles({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    marginBottom: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  formContainer: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#333",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  genderContainer: {
    flexDirection: "row",
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "white",
    alignItems: "center",
  },
  genderButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  genderButtonTextActive: {
    color: "white",
  },
  buttonContainer: {
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  toggleContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  toggleText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  toggleLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  testDataContainer: {
    backgroundColor: "#FFF8E1",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FFC107",
  },
  testDataTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F57F17",
    marginBottom: 6,
  },
  testDataText: {
    fontSize: 12,
    color: "#F57F17",
    marginBottom: 2,
  },
});
