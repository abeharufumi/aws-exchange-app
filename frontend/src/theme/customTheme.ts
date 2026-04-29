import { MD3DarkTheme, MD3LightTheme, type MD3Theme, configureFonts } from "react-native-paper";

const baseFontConfig = {
  fontFamily: "System",
} as const;

export const lightPaperTheme: MD3Theme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: baseFontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    primary: "#2563eb",
    secondary: "#1d4ed8",
    error: "#dc2626",
    surfaceVariant: "#f3f4f6",
    outline: "#d1d5db",
  },
};

export const darkPaperTheme: MD3Theme = {
  ...MD3DarkTheme,
  fonts: configureFonts({ config: baseFontConfig }),
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#60a5fa",
    secondary: "#93c5fd",
    error: "#f87171",
    surfaceVariant: "#1f2937",
    outline: "#374151",
  },
};
