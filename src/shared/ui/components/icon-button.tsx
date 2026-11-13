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

export type IconButtonProps = {
  icon: LucideIcon;
  /** Required: the icon alone has no accessible name. */
  accessibilityLabel: string;
  onPress: () => void;
  /** Defaults to `primary`. */
  variant?: ButtonVariant;
  /** Squares of 36, 48 (default) and 56. */
  size?: ButtonSize;
  isLoading?: boolean;
  isDisabled?: boolean;
};

/** Square, icon-only button with the same variants and states as `Button`. */
export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  variant = "primary",
  size = "md",
  isLoading = false,
  isDisabled = false,
}: IconButtonProps) {
  const contentColor = isDisabled ? "onDisabled" : buttonContentColors[variant];

  styles.useVariants({
    variant,
    size,
    state: buttonState({ isDisabled, isLoading }),
    isBlock: false,
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      disabled={isDisabled || isLoading}
      hitSlop={touchTargetSlop(sizeTokens.control[size])}
      onPress={onPress}
      style={({ pressed }) => [
        styles.frame,
        styles.square,
        pressed ? styles.pressed : null,
      ]}
    >
      {isLoading ? (
        <UniActivityIndicator
          size="small"
          uniProps={(theme) => ({ color: theme.colors[contentColor] })}
        />
      ) : (
        <Icon
          icon={icon}
          size={size === "sm" ? "sm" : "md"}
          color={contentColor}
        />
      )}
    </Pressable>
  );
}
