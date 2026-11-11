import type { ReactNode } from "react";
import { Pressable } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "./text";

export type OptionRowProps = {
  role: "checkbox" | "radio" | "switch";
  label: string;
  isChecked: boolean;
  isDisabled: boolean;
  /** The visual control: a box, a circle or a track. */
  control: ReactNode;
  /** Places the control after the label, as settings rows do for switches. */
  isControlTrailing?: boolean;
  onPress: () => void;
};

/**
 * Pressable row shared by selection controls: the whole row is the touch
 * target (at least 44 pt tall) and carries the role and checked state.
 */
export function OptionRow({
  role,
  label,
  isChecked,
  isDisabled,
  control,
  isControlTrailing = false,
  onPress,
}: OptionRowProps) {
  styles.useVariants({ isControlTrailing });

  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityState={{ checked: isChecked, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={styles.row}
    >
      {control}
      <Text color={isDisabled ? "onDisabled" : "text"} style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
    minHeight: 44,
    variants: {
      isControlTrailing: {
        true: { flexDirection: "row-reverse" },
      },
    },
  },
  label: {
    variants: {
      isControlTrailing: {
        true: { flex: 1 },
      },
    },
  },
}));
