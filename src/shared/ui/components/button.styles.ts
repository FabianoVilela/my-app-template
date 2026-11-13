import { ActivityIndicator } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { size } from "../theme";
import type { TextColor } from "./text";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "soft"
  | "outline"
  | "ghost"
  | "danger"
  | "ghostDanger";

export type ButtonSize = "sm" | "md" | "lg";

/** Mutually exclusive non-pressed states; pressing is a style, not state. */
export type ButtonState = "idle" | "loading" | "disabled";

/** Text and icon color role for each variant. */
export const buttonContentColors: Record<ButtonVariant, TextColor> = {
  primary: "onPrimary",
  secondary: "onSecondary",
  soft: "onPrimarySoft",
  outline: "text",
  ghost: "text",
  danger: "onDanger",
  ghostDanger: "danger",
};

/** Spinner whose color follows the theme through `uniProps`. */
export const UniActivityIndicator = withUnistyles(ActivityIndicator);

/** Smallest hit slop that brings a control up to the touch target. */
export function touchTargetSlop(height: number) {
  return Math.max(0, (size.touchTarget - height) / 2);
}

export function buttonState(flags: {
  isDisabled: boolean;
  isLoading: boolean;
}): ButtonState {
  if (flags.isDisabled) return "disabled";
  if (flags.isLoading) return "loading";

  return "idle";
}

/** Frame styles shared by `Button` and `IconButton`. */
export const buttonStyles = StyleSheet.create((theme) => {
  const fill = (color: string, border = color) => ({
    backgroundColor: color,
    borderColor: border,
  });
  const restingShadow = (variant: ButtonVariant) => ({
    variant,
    state: "idle" as const,
    styles: { boxShadow: theme.shadows.sm },
  });

  return {
    frame: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing[2],
      borderWidth: 1,
      borderRadius: theme.radius.md,
      borderCurve: "continuous",
      variants: {
        variant: {
          primary: fill(theme.colors.primary),
          secondary: fill(theme.colors.secondary),
          soft: fill(theme.colors.primarySoft, "transparent"),
          outline: fill(theme.colors.surface, theme.colors.borderStrong),
          ghost: fill("transparent"),
          danger: fill(theme.colors.danger),
          ghostDanger: fill("transparent"),
        },
        size: {
          sm: { height: theme.size.control.sm, paddingHorizontal: 14 },
          md: {
            height: theme.size.control.md,
            paddingHorizontal: theme.spacing[5],
          },
          lg: {
            height: theme.size.control.lg,
            paddingHorizontal: theme.spacing[6],
          },
        },
        state: {
          idle: {},
          loading: { opacity: theme.state.loadingOpacity },
          disabled: fill(theme.colors.disabled, "transparent"),
        },
        isBlock: {
          true: { alignSelf: "stretch" },
          false: { alignSelf: "flex-start" },
        },
      },
      compoundVariants: [restingShadow("primary"), restingShadow("secondary")],
    },
    // Applied on top of `frame` while pressed: tone shift, no shadow.
    pressed: {
      boxShadow: theme.shadows.none,
      variants: {
        variant: {
          primary: fill(theme.colors.primaryPressed),
          secondary: fill(theme.colors.secondaryPressed),
          soft: fill(theme.colors.primarySoftPressed, "transparent"),
          outline: fill(theme.colors.surfaceMuted, theme.colors.borderStrong),
          ghost: fill(theme.colors.surfaceMuted, "transparent"),
          danger: fill(theme.colors.dangerPressed),
          ghostDanger: fill(theme.colors.surfaceMuted, "transparent"),
        },
      },
    },
    square: {
      aspectRatio: 1,
      paddingHorizontal: 0,
    },
    label: {
      flexShrink: 1,
      variants: {
        size: {
          sm: { fontSize: 14, lineHeight: 20 },
          md: {},
          lg: { fontSize: 17 },
        },
      },
    },
  };
});
