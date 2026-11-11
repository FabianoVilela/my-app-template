import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { loadAsync } from "expo-font";

/** The design system's only typeface; `fontWeight` selects the face. */
export const fontFamily = "Plus Jakarta Sans";

/**
 * Registers every weight the typography tokens use under one family. Text
 * falls back to the system font until it resolves, or if it rejects.
 */
export function loadFonts(): Promise<void> {
  return loadAsync([
    {
      fontFamily,
      fontDefinitions: [
        { path: PlusJakartaSans_400Regular, weight: 400, style: "normal" },
        { path: PlusJakartaSans_500Medium, weight: 500, style: "normal" },
        { path: PlusJakartaSans_600SemiBold, weight: 600, style: "normal" },
        { path: PlusJakartaSans_700Bold, weight: 700, style: "normal" },
        { path: PlusJakartaSans_800ExtraBold, weight: 800, style: "normal" },
      ],
    },
  ]);
}
