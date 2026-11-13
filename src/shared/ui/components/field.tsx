import { CircleAlert, type LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, TextInput, type TextInputProps, View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { Icon } from "./icon";
import { Text } from "./text";

/*
 * Private building blocks of `Input`, `PasswordInput` and `SearchInput`.
 * Each field composes them instead of switching on a mode prop.
 */

/** Props every text field accepts. */
export type FieldProps = Omit<
  TextInputProps,
  | "style"
  | "editable"
  | "secureTextEntry"
  | "placeholderTextColor"
  | "value"
  | "onChangeText"
> & {
  /** The field's accessible name. */
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  helperText?: string;
  /** Replaces the helper text and marks the field invalid. */
  errorText?: string;
  isDisabled?: boolean;
};

export type FieldFrameProps = {
  /** Visible label; omit when the field shows none, as search bars do. */
  visibleLabel?: string;
  helperText?: string;
  errorText?: string;
  isDisabled: boolean;
  isFocused: boolean;
  /** `pill` is the rounded, filled search shape. Defaults to `box`. */
  shape?: "box" | "pill";
  /** Leading icon, input and trailing actions, in order. */
  children: ReactNode;
};

type BoxState = "idle" | "focused" | "error" | "disabled";

/** Label, bordered box with focus/error/disabled states, and message. */
export function FieldFrame({
  visibleLabel,
  helperText,
  errorText,
  isDisabled,
  isFocused,
  shape = "box",
  children,
}: FieldFrameProps) {
  const hasError = errorText !== undefined;

  styles.useVariants({
    shape,
    state: boxState({ isDisabled, hasError, isFocused }),
  });

  return (
    <View style={styles.field}>
      {visibleLabel === undefined ? null : (
        // The input carries the label as its accessible name.
        <Text
          variant="label"
          color={isDisabled ? "onDisabled" : "text"}
          importantForAccessibility="no"
          accessibilityElementsHidden
        >
          {visibleLabel}
        </Text>
      )}
      <View style={styles.box}>{children}</View>
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

const UniTextInput = withUnistyles(TextInput, (theme) => ({
  placeholderTextColor: theme.colors.textMuted,
  selectionColor: theme.colors.primary,
  cursorColor: theme.colors.primary,
}));

export type FieldInputProps = TextInputProps & { isDisabled: boolean };

/** The themed text input inside a `FieldFrame`. */
export function FieldInput({ isDisabled, ...props }: FieldInputProps) {
  styles.useVariants({ isDisabled });

  return (
    <UniTextInput
      {...props}
      editable={!isDisabled}
      accessibilityState={{ disabled: isDisabled }}
      style={styles.input}
    />
  );
}

/** Leading icon in the field's muted color. */
export function FieldIcon({
  icon,
  isDisabled,
}: {
  icon: LucideIcon;
  isDisabled: boolean;
}) {
  return <Icon icon={icon} color={isDisabled ? "onDisabled" : "textMuted"} />;
}

export type FieldActionProps = {
  icon: LucideIcon;
  accessibilityLabel: string;
  isDisabled: boolean;
  onPress: () => void;
};

/** Icon button at the field's trailing edge, a full touch target tall. */
export function FieldAction({
  icon,
  accessibilityLabel,
  isDisabled,
  onPress,
}: FieldActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={isDisabled}
      onPress={onPress}
      style={styles.action}
    >
      <FieldIcon icon={icon} isDisabled={isDisabled} />
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
    height: theme.size.control.md,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderCurve: "continuous",
    variants: {
      shape: {
        box: {
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surface,
        },
        pill: {
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.surfaceMuted,
        },
      },
      state: {
        idle: { borderColor: theme.colors.control },
        // Focus and error show in the border alone, with no halo.
        focused: { borderColor: theme.colors.focus },
        error: { borderColor: theme.colors.danger },
        disabled: {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.disabled,
        },
      },
    },
    compoundVariants: [
      // Pills hide their resting border in the fill color.
      {
        shape: "pill",
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
    variants: {
      isDisabled: {
        true: { color: theme.colors.onDisabled },
        false: { color: theme.colors.text },
      },
    },
  },
  action: {
    alignItems: "center",
    justifyContent: "center",
    width: theme.size.touchTarget,
    height: theme.size.touchTarget,
    marginRight: -12,
    borderRadius: theme.radius.sm,
  },
  message: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
}));
