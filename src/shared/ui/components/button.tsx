import type { LucideIcon } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { Icon } from "./icon";
import { Text, type TextColor } from "./text";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "soft"
  | "outline"
  | "ghost"
  | "danger"
  | "ghostDanger";

export type ButtonSize = "sm" | "md" | "lg";

type CommonProps = {
  onPress: () => void;
  /** Defaults to `primary`. */
  variant?: ButtonVariant;
  /** Heights 36, 48 (default) and 56. */
  size?: ButtonSize;
  /** Shows a spinner, fades the button and ignores presses. */
  isLoading?: boolean;
  isDisabled?: boolean;
  /** Stretches to the container width. */
  isBlock?: boolean;
};

type LabeledProps = CommonProps & {
  label: string;
  leadingIcon?: LucideIcon;
  trailingIcon?: LucideIcon;
  icon?: never;
  accessibilityLabel?: string;
};

type IconOnlyProps = CommonProps & {
  /** Renders a square, icon-only button. */
  icon: LucideIcon;
  /** Required: the icon alone has no accessible name. */
  accessibilityLabel: string;
  label?: never;
  leadingIcon?: never;
  trailingIcon?: never;
};

export type ButtonProps = LabeledProps | IconOnlyProps;

type ButtonState = "idle" | "pressed" | "loading" | "disabled";

const contentColors: Record<ButtonVariant, TextColor> = {
  primary: "onPrimary",
  secondary: "onSecondary",
  soft: "onPrimarySoft",
  outline: "text",
  ghost: "text",
  danger: "onDanger",
  ghostDanger: "danger",
};

const UniActivityIndicator = withUnistyles(ActivityIndicator);

/** Touch button: tone shift when pressed, no scale and no hover. */
export function Button(props: ButtonProps) {
  const {
    onPress,
    variant = "primary",
    size = "md",
    isLoading = false,
    isDisabled = false,
    isBlock = false,
  } = props;
  const [isPressed, setIsPressed] = useState(false);
  const isIconOnly = props.icon !== undefined;
  const state = buttonState({ isDisabled, isLoading, isPressed });
  const contentColor = isDisabled ? "onDisabled" : contentColors[variant];
  const iconSize = size === "sm" ? "sm" : "md";
  // An icon-only button shows its icon where a labeled one shows the leading icon.
  const leadingIcon = props.icon ?? props.leadingIcon;

  styles.useVariants({ variant, size, state, isIconOnly, isBlock });

  const spinner = (
    <UniActivityIndicator
      size="small"
      uniProps={(theme) => ({ color: theme.colors[contentColor] })}
    />
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      disabled={isDisabled || isLoading}
      hitSlop={size === "sm" ? 4 : undefined}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={styles.button}
    >
      {isLoading ? spinner : null}
      {!isLoading && leadingIcon ? (
        <Icon icon={leadingIcon} size={iconSize} color={contentColor} />
      ) : null}
      {props.label === undefined ? null : (
        <Text
          variant="button"
          color={contentColor}
          numberOfLines={1}
          style={styles.label}
        >
          {props.label}
        </Text>
      )}
      {props.trailingIcon ? (
        <Icon icon={props.trailingIcon} size={iconSize} color={contentColor} />
      ) : null}
    </Pressable>
  );
}

function buttonState(flags: {
  isDisabled: boolean;
  isLoading: boolean;
  isPressed: boolean;
}): ButtonState {
  if (flags.isDisabled) return "disabled";
  if (flags.isLoading) return "loading";
  if (flags.isPressed) return "pressed";

  return "idle";
}

const styles = StyleSheet.create((theme) => {
  const fill = (color: string, border = color) => ({
    backgroundColor: color,
    borderColor: border,
  });
  const pressedOn = (
    variant: ButtonVariant,
    color: string,
    border = "transparent",
  ) => ({ variant, state: "pressed" as const, styles: fill(color, border) });
  const restingShadow = (variant: ButtonVariant) => ({
    variant,
    state: "idle" as const,
    styles: { boxShadow: theme.shadows.sm },
  });

  return {
    button: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing[2],
      borderWidth: 1,
      borderRadius: theme.radius.md,
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
          sm: { height: 36, paddingHorizontal: 14 },
          md: { height: 48, paddingHorizontal: theme.spacing[5] },
          lg: { height: 56, paddingHorizontal: theme.spacing[6] },
        },
        state: {
          idle: {},
          pressed: {},
          loading: { opacity: theme.state.loadingOpacity },
          disabled: fill(theme.colors.disabled, "transparent"),
        },
        isIconOnly: {
          true: { aspectRatio: 1, paddingHorizontal: 0 },
        },
        isBlock: {
          true: { alignSelf: "stretch" },
          false: { alignSelf: "flex-start" },
        },
      },
      compoundVariants: [
        pressedOn(
          "primary",
          theme.colors.primaryPressed,
          theme.colors.primaryPressed,
        ),
        pressedOn(
          "secondary",
          theme.colors.secondaryPressed,
          theme.colors.secondaryPressed,
        ),
        pressedOn("soft", theme.colors.primarySoftPressed),
        pressedOn(
          "outline",
          theme.colors.surfaceMuted,
          theme.colors.borderStrong,
        ),
        pressedOn("ghost", theme.colors.surfaceMuted),
        pressedOn(
          "danger",
          theme.colors.dangerPressed,
          theme.colors.dangerPressed,
        ),
        pressedOn("ghostDanger", theme.colors.surfaceMuted),
        restingShadow("primary"),
        restingShadow("secondary"),
      ],
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
