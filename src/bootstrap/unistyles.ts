import { StyleSheet } from "react-native-unistyles";
import { breakpoints, darkTheme, lightTheme } from "@/shared/ui/theme";

type AppThemes = { light: typeof lightTheme; dark: typeof darkTheme };
type AppBreakpoints = typeof breakpoints;

declare module "react-native-unistyles" {
  export interface UnistylesThemes extends AppThemes {}
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}

// Imported by the root index.ts after expo-router/entry, before any route
// module creates a StyleSheet. Themes follow the OS appearance.
StyleSheet.configure({
  themes: { light: lightTheme, dark: darkTheme },
  breakpoints,
  settings: { adaptiveThemes: true },
});
