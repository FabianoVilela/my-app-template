import { Platform } from "react-native";
import { fontFamily } from "./fonts";

/*
 * Design System · Teal. This file is the source of truth for token values;
 * docs/architecture/design-system.md explains their meaning and usage rules.
 * Tokens below are shared by every theme; colors and shadows vary per theme.
 */

/** 4pt grid. Keys are multiples of 4: `spacing[4]` is 16. */
const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

/** `md` for buttons and inputs, `xl` for cards and sheets. */
const radius = {
  xs: 6,
  sm: 10,
  md: 12,
  lg: 16,
  xl: 18,
  xxl: 28,
  full: 999,
} as const;

const mono = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "ui-monospace, Menlo, monospace",
});

/** Text styles without color; components pick a color role. */
const typography = {
  display: {
    fontFamily,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1.2,
    fontWeight: "800",
  },
  h1: {
    fontFamily,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.6,
    fontWeight: "700",
  },
  h2: {
    fontFamily,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    fontWeight: "700",
  },
  h3: {
    fontFamily,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: -0.1,
    fontWeight: "600",
  },
  body: { fontFamily, fontSize: 16, lineHeight: 24, fontWeight: "400" },
  bodySmall: { fontFamily, fontSize: 14, lineHeight: 20, fontWeight: "400" },
  label: { fontFamily, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  button: {
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.1,
    fontWeight: "600",
  },
  helper: { fontFamily, fontSize: 13, lineHeight: 18, fontWeight: "400" },
  caption: { fontFamily, fontSize: 12, lineHeight: 16, fontWeight: "400" },
  overline: {
    fontFamily,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.8,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  mono: { fontFamily: mono, fontSize: 12, lineHeight: 16 },
} as const;

/** Lucide icons, always rendered through the shared `Icon` component. */
const icon = {
  size: { sm: 16, md: 20, lg: 24 },
  strokeWidth: 1.75,
} as const;

/** Control dimensions in points; the same in every theme. */
export const size = {
  /** Minimum touch target for anything pressable. */
  touchTarget: 44,
  /** Checkbox and radio indicators. */
  selectionControl: 22,
  /** Heights shared by buttons and text fields. */
  control: { sm: 36, md: 48, lg: 56 },
} as const;

/**
 * Durations in ms; `easing` is a cubic-bezier for `Easing.bezier`. Exported
 * because motion is the same in every theme: animation code imports it
 * instead of subscribing to theme changes.
 */
export const motion = {
  duration: { fast: 120, base: 200, slow: 320 },
  easing: [0.2, 0.8, 0.2, 1],
} as const;

/** Interaction states that are not colors. */
const state = {
  /** Busy controls keep their variant color at this opacity. */
  loadingOpacity: 0.7,
} as const;

const shared = { spacing, radius, typography, icon, size, motion, state };

export const lightTheme = {
  colors: {
    background: "#F5F7FA",
    surface: "#FFFFFF",
    surfaceMuted: "#EEF1F5",
    border: "#E2E6EC",
    borderStrong: "#C8CED8",
    /** Unchecked borders of inputs, checkboxes and radios. */
    control: "#868E9E",
    text: "#1F2433",
    textSecondary: "#4A5163",
    textMuted: "#646C7E",
    inverse: "#1F2433",
    onInverse: "#FFFFFF",
    // White on primary is 2.6:1, below WCAG AA; the owner chose it. Text and
    // outlines that must pass use `link` and `focus` instead.
    primary: "#17B5A6",
    primaryPressed: "#0F9688",
    onPrimary: "#FFFFFF",
    primarySoft: "#E6F8F6",
    primarySoftPressed: "#D4E4E2",
    onPrimarySoft: "#0A6B62",
    link: "#0B7D72",
    focus: "#0B7D72",
    secondary: "#232B3E",
    secondaryPressed: "#161C2B",
    onSecondary: "#FFFFFF",
    highlight: "#F2EEFE",
    onHighlight: "#6B3FD4",
    success: "#15803D",
    successSoft: "#E5F6EA",
    warning: "#A15C00",
    warningSoft: "#FFF5DB",
    danger: "#D92D48",
    dangerPressed: "#C82942",
    dangerSoft: "#FDEAED",
    onDanger: "#FFFFFF",
    info: "#2563EB",
    infoSoft: "#E8EFFE",
    disabled: "#EEF1F5",
    onDisabled: "#9AA2B1",
    knob: "#FFFFFF",
    track: "rgba(31, 36, 51, 0.18)",
  },
  /** `boxShadow` values. Pressed filled buttons drop theirs. */
  shadows: {
    sm: "0 1px 2px rgba(31, 36, 51, 0.06)",
    md: "0 1px 2px rgba(31, 36, 51, 0.04), 0 8px 20px -6px rgba(31, 36, 51, 0.12)",
    lg: "0 2px 6px rgba(31, 36, 51, 0.05), 0 28px 56px -16px rgba(31, 36, 51, 0.24)",
    /** Cards; the dark theme relies on the card border instead. */
    card: "0 1px 2px rgba(31, 36, 51, 0.06)",
    /** Removes a resting shadow, as pressed buttons do. */
    none: "0 0 0 0 rgba(0, 0, 0, 0)",
    /** Switch knob; the same in both themes. */
    knob: "0 1px 3px rgba(11, 14, 31, 0.3)",
  },
  ...shared,
};

export const darkTheme = {
  colors: {
    background: "#232B3E",
    surface: "#2B344A",
    surfaceMuted: "#343E56",
    border: "#3B4560",
    borderStrong: "#4A5571",
    control: "#7A839B",
    text: "#F4F6FA",
    textSecondary: "#B3BACA",
    textMuted: "#9AA2B5",
    inverse: "#F4F6FA",
    onInverse: "#1F2433",
    primary: "#17B5A6",
    primaryPressed: "#2CC5B6",
    onPrimary: "#FFFFFF",
    primarySoft: "#1F4A4C",
    primarySoftPressed: "#235355",
    onPrimarySoft: "#7FE3D6",
    link: "#2EC4B6",
    focus: "#2EC4B6",
    secondary: "#3D4863",
    secondaryPressed: "#4A5571",
    onSecondary: "#FFFFFF",
    highlight: "#3A3366",
    onHighlight: "#C4B2FF",
    success: "#4ADE80",
    successSoft: "#234537",
    warning: "#FCC85A",
    warningSoft: "#463D2C",
    danger: "#FF7A8C",
    dangerPressed: "#FF899D",
    dangerSoft: "#4A2E3E",
    onDanger: "#2A0810",
    info: "#7AA7FF",
    infoSoft: "#233759",
    disabled: "#343E56",
    onDisabled: "#7A839B",
    knob: "#FFFFFF",
    track: "rgba(31, 36, 51, 0.22)",
  },
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.35)",
    md: "0 1px 2px rgba(0, 0, 0, 0.35), 0 10px 24px -8px rgba(0, 0, 0, 0.5)",
    lg: "0 2px 6px rgba(0, 0, 0, 0.35), 0 28px 56px -16px rgba(0, 0, 0, 0.6)",
    card: "0 0 0 0 rgba(0, 0, 0, 0)",
    none: "0 0 0 0 rgba(0, 0, 0, 0)",
    knob: "0 1px 3px rgba(11, 14, 31, 0.3)",
  },
  ...shared,
} satisfies typeof lightTheme;

/** Minimum window widths; the first breakpoint must start at 0. */
export const breakpoints = { xs: 0, sm: 576, md: 768, lg: 992, xl: 1200 };
