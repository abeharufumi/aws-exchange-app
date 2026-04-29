import { ImageStyle, TextStyle, ViewStyle } from "react-native";

type NamedThemeStyles<T> = {
  [K in keyof T]: ViewStyle | TextStyle | ImageStyle;
};

export function createThemeStyles<T extends NamedThemeStyles<T>>(styles: T): T {
  return styles;
}
