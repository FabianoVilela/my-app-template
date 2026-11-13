import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { OptionLabel, OptionRow } from "./option-row";

export type CheckboxProps = {
  label: string;
  isChecked: boolean;
  onCheckedChange: (isChecked: boolean) => void;
  isDisabled?: boolean;
};

/** Independent on/off choice; the label is part of the touch target. */
export function Checkbox({
  label,
  isChecked,
  onCheckedChange,
  isDisabled = false,
}: CheckboxProps) {
  styles.useVariants({ isChecked, isDisabled });

  return (
    <OptionRow
      role="checkbox"
      label={label}
      isChecked={isChecked}
      isDisabled={isDisabled}
      onPress={() => onCheckedChange(!isChecked)}
    >
      <View style={styles.box}>
        {isChecked ? <View style={styles.checkmark} /> : null}
      </View>
      <OptionLabel isDisabled={isDisabled}>{label}</OptionLabel>
    </OptionRow>
  );
}

const styles = StyleSheet.create((theme) => ({
  box: {
    alignItems: "center",
    justifyContent: "center",
    width: theme.size.selectionControl,
    height: theme.size.selectionControl,
    borderWidth: 1.5,
    borderRadius: theme.radius.xs,
    variants: {
      isChecked: {
        true: {
          borderColor: theme.colors.primary,
          backgroundColor: theme.colors.primary,
        },
        false: {
          borderColor: theme.colors.control,
          backgroundColor: theme.colors.surface,
        },
      },
      isDisabled: {
        true: {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.disabled,
        },
      },
    },
  },
  // An L rotated into a check, matching the visual reference stroke.
  checkmark: {
    width: 10,
    height: 5,
    marginTop: -3,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: "-45deg" }],
    variants: {
      isDisabled: {
        true: { borderColor: theme.colors.onDisabled },
        false: { borderColor: theme.colors.onPrimary },
      },
    },
  },
}));
