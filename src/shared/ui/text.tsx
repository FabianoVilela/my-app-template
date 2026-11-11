import {
  Text as NativeText,
  type TextProps as NativeTextProps,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { lightTheme } from "./theme";

type Theme = typeof lightTheme;

export type TextVariant = keyof Theme["typography"];
export type TextColor = keyof Theme["colors"];

export type TextProps = NativeTextProps & {
  /** Typography token; defaults to `body`. */
  variant?: TextVariant;
  /** Color role; defaults to `text`. */
  color?: TextColor;
};

const headingVariants = new Set<TextVariant>(["display", "h1", "h2", "h3"]);

/** Themed text. Headings announce themselves as headers to assistive tech. */
export function Text({
  variant = "body",
  color = "text",
  style,
  ...props
}: TextProps) {
  styles.useVariants({ variant, color });

  return (
    <NativeText
      accessibilityRole={headingVariants.has(variant) ? "header" : undefined}
      {...props}
      style={[styles.text, style]}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  text: {
    variants: {
      variant: theme.typography,
      color: colorStyles(theme.colors),
    },
  },
}));

function colorStyles(colors: Theme["colors"]) {
  return Object.fromEntries(
    Object.entries(colors).map(([role, color]) => [role, { color }]),
  ) as Record<TextColor, { color: string }>;
}
