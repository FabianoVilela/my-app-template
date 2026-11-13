import type { LucideIcon } from "lucide-react-native";
import { Pressable } from "react-native";
import { size as sizeTokens } from "../theme";
import {
  type ButtonSize,
  type ButtonVariant,
  buttonContentColors,
  buttonState,
  buttonStyles as styles,
  touchTargetSlop,
  UniActivityIndicator,
} from "./button.styles";
import { Icon } from "./icon";
import { Text } from "./text";

export type { ButtonSize, ButtonVariant } from "./button.styles";

export type ButtonProps = {
  label: string;
  onPress: () => void;
  /** Defaults to `primary`. */
  variant?: ButtonVariant;
  /** Heights 36, 48 (default) and 56. */
  size?: ButtonSize;
  leadingIcon?: LucideIcon;
  trailingIcon?: LucideIcon;
  /** Shows a spinner, fades the button and ignores presses. */
  isLoading?: boolean;
  isDisabled?: boolean;
  /** Stretches to the container width. */
  isBlock?: boolean;
  /** Overrides the label as the accessible name. */
  accessibilityLabel?: string;
};

/** Labeled touch button: tone shift when pressed, no scale and no hover. */
export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  leadingIcon,
  trailingIcon,
  isLoading = false,
  isDisabled = false,
  isBlock = false,
  accessibilityLabel,
}: ButtonProps) {
  const contentColor = isDisabled ? "onDisabled" : buttonContentColors[variant];
  const iconSize = size === "sm" ? "sm" : "md";

  styles.useVariants({
    variant,
    size,
    state: buttonState({ isDisabled, isLoading }),
    isBlock,
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      disabled={isDisabled || isLoading}
      hitSlop={touchTargetSlop(sizeTokens.control[size])}
      onPress={onPress}
      style={({ pressed }) => [styles.frame, pressed ? styles.pressed : null]}
    >
      {isLoading ? (
        <UniActivityIndicator
          size="small"
          uniProps={(theme) => ({ color: theme.colors[contentColor] })}
        />
      ) : null}
      {!isLoading && leadingIcon ? (
        <Icon icon={leadingIcon} size={iconSize} color={contentColor} />
      ) : null}
      <Text
        variant="button"
        color={contentColor}
        numberOfLines={1}
        style={styles.label}
      >
        {label}
      </Text>
      {trailingIcon ? (
        <Icon icon={trailingIcon} size={iconSize} color={contentColor} />
      ) : null}
    </Pressable>
  );
}
