import {
  CircleAlert,
  Eye,
  EyeOff,
  type LucideIcon,
  Search,
  X,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, TextInput, type TextInputProps, View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { useAppTranslation } from "@/shared/i18n";
import { Icon } from "./icon";
import { Text } from "./text";

export type InputType = "text" | "password" | "search";

export type InputProps = Omit<
  TextInputProps,
  | "style"
  | "editable"
  | "secureTextEntry"
  | "placeholderTextColor"
  | "value"
  | "onChangeText"
> & {
  /** Visible field label and the input's accessible name. */
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  /** `password` adds a show/hide toggle; `search` a pill with a clear button. */
  type?: InputType;
  /** Hides the visible label, as search bars do; it stays the accessible name. */
  isLabelHidden?: boolean;
  /** Defaults to a search icon for `search`. */
  leadingIcon?: LucideIcon;
  helperText?: string;
  /** Replaces the helper text and marks the field invalid. */
  errorText?: string;
  isDisabled?: boolean;
};

type BoxState = "idle" | "focused" | "error" | "disabled";

const UniTextInput = withUnistyles(TextInput, (theme) => ({
  placeholderTextColor: theme.colors.textMuted,
  selectionColor: theme.colors.primary,
  cursorColor: theme.colors.primary,
}));

/** Labeled single-line text field with helper, error and disabled states. */
export function Input({
  label,
  value,
  onChangeText,
  type = "text",
  isLabelHidden = false,
  leadingIcon,
  helperText,
  errorText,
  isDisabled = false,
  onFocus,
  onBlur,
  ...inputProps
}: InputProps) {
  const { t } = useAppTranslation("ui");
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const hasError = errorText !== undefined;
  const state = boxState({ isDisabled, hasError, isFocused });
  const icon = leadingIcon ?? (type === "search" ? Search : undefined);
  const iconColor = isDisabled ? "onDisabled" : "textMuted";

  styles.useVariants({ state, isSearch: type === "search" });

  return (
    <View style={styles.field}>
      {isLabelHidden ? null : (
        <Text
          variant="label"
          color={isDisabled ? "onDisabled" : "text"}
          importantForAccessibility="no"
          accessibilityElementsHidden
        >
          {label}
        </Text>
      )}
      <View style={styles.box}>
        {icon ? <Icon icon={icon} color={iconColor} /> : null}
        <UniTextInput
          // Passwords and search terms are not prose; callers may override.
          autoCapitalize={type === "text" ? undefined : "none"}
          autoCorrect={type === "text" ? undefined : false}
          returnKeyType={type === "search" ? "search" : undefined}
          {...inputProps}
          value={value}
          onChangeText={onChangeText}
          editable={!isDisabled}
          secureTextEntry={type === "password" && !isPasswordVisible}
          accessibilityLabel={label}
          accessibilityHint={errorText ?? helperText}
          accessibilityState={{ disabled: isDisabled }}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          style={styles.input}
        />
        {type === "password" ? (
          <TrailingButton
            icon={isPasswordVisible ? EyeOff : Eye}
            accessibilityLabel={
              isPasswordVisible ? t("hidePassword") : t("showPassword")
            }
            isDisabled={isDisabled}
            onPress={() => setIsPasswordVisible((isVisible) => !isVisible)}
          />
        ) : null}
        {type === "search" && value.length > 0 ? (
          <TrailingButton
            icon={X}
            accessibilityLabel={t("clearSearch")}
            isDisabled={isDisabled}
            onPress={() => onChangeText("")}
          />
        ) : null}
      </View>
      {hasError ? (
        <View style={styles.message} accessibilityLiveRegion="polite">
          <Icon icon={CircleAlert} size="sm" color="danger" />
          <Text variant="helper" color="danger">
            {errorText}
          </Text>
        </View>
      ) : null}
      {!hasError && helperText !== undefined ? (
        <Text variant="helper" color="textMuted">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

type TrailingButtonProps = {
  icon: LucideIcon;
  accessibilityLabel: string;
  isDisabled: boolean;
  onPress: () => void;
};

/** 44 pt icon button inside the field's right edge. */
function TrailingButton({
  icon,
  accessibilityLabel,
  isDisabled,
  onPress,
}: TrailingButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={isDisabled}
      onPress={onPress}
      style={styles.trailingButton}
    >
      <Icon icon={icon} color={isDisabled ? "onDisabled" : "textMuted"} />
    </Pressable>
  );
}

function boxState(flags: {
  isDisabled: boolean;
  hasError: boolean;
  isFocused: boolean;
}): BoxState {
  if (flags.isDisabled) return "disabled";
  if (flags.hasError) return "error";
  if (flags.isFocused) return "focused";

  return "idle";
}

const styles = StyleSheet.create((theme) => ({
  field: {
    gap: 6,
  },
  box: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    variants: {
      isSearch: {
        true: {
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.surfaceMuted,
        },
      },
      state: {
        idle: { borderColor: theme.colors.control },
        focused: {
          borderColor: theme.colors.focus,
          boxShadow: `0 0 0 4px ${theme.colors.focusRing}`,
        },
        error: {
          borderColor: theme.colors.danger,
          boxShadow: `0 0 0 4px ${theme.colors.dangerSoft}`,
        },
        disabled: {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.disabled,
        },
      },
    },
    compoundVariants: [
      // Search pills hide their resting border in the fill color.
      {
        isSearch: true,
        state: "idle",
        styles: { borderColor: theme.colors.surfaceMuted },
      },
    ],
  },
  input: {
    flex: 1,
    alignSelf: "stretch",
    padding: 0,
    // No lineHeight: iOS misplaces single-line input text when it is set.
    fontFamily: theme.typography.body.fontFamily,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    variants: {
      state: {
        disabled: { color: theme.colors.onDisabled },
      },
    },
  },
  trailingButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    marginRight: -12,
    borderRadius: theme.radius.sm,
  },
  message: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
}));
