import { createThemeStyles } from "./createThemeStyles";

export const reviewStyles = createThemeStyles({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#000",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#fff",
  },
  ratingContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#fff",
  },
  stars: {
    flexDirection: "row",
    gap: 10,
  },
  star: {
    fontSize: 32,
    color: "#6b7280",
  },
  starActive: {
    color: "#ffc107",
  },
  commentContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#2563eb",
    backgroundColor: "#fff",
    color: "#111827",
    padding: 12,
    borderRadius: 8,
    minHeight: 100,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#e74c3c",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
