import type { ReactNode } from "react";
import { Pressable } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "./text";

export type OptionRowProps = {
  role: "checkbox" | "radio" | "switch";
  /** Accessible name of the whole row. */
  label: string;
  isChecked: boolean;
  isDisabled: boolean;
  onPress: () => void;
  /** The control and an `OptionLabel`, in visual order. */
  children: ReactNode;
};

/**
 * Pressable row shared by selection controls: the whole row is the touch
 * target and carries the role and checked state.
 */
export function OptionRow({
  role,
  label,
  isChecked,
  isDisabled,
  onPress,
  children,
}: OptionRowProps) {
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityState={{ checked: isChecked, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={styles.row}
    >
      {children}
    </Pressable>
  );
}

export type OptionLabelProps = {
  children: string;
  isDisabled: boolean;
};

/** Row label; it grows so a trailing control sits at the row's end. */
export function OptionLabel({ children, isDisabled }: OptionLabelProps) {
  return (
    <Text color={isDisabled ? "onDisabled" : "text"} style={styles.label}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
    minHeight: theme.size.touchTarget,
  },
  label: {
    flex: 1,
  },
}));
