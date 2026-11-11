import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { OptionRow } from "./option-row";

export type RadioButtonProps = {
  label: string;
  isSelected: boolean;
  /** Called when an unselected option is pressed; selection never clears. */
  onSelect: () => void;
  isDisabled?: boolean;
};

/**
 * One option of a mutually exclusive set. Wrap the set in a view with
 * `accessibilityRole="radiogroup"` and keep the selected value in the parent.
 */
export function RadioButton({
  label,
  isSelected,
  onSelect,
  isDisabled = false,
}: RadioButtonProps) {
  styles.useVariants({ isSelected, isDisabled });

  return (
    <OptionRow
      role="radio"
      label={label}
      isChecked={isSelected}
      isDisabled={isDisabled}
      onPress={() => {
        if (!isSelected) onSelect();
      }}
      control={
        <View style={styles.circle}>
          {isSelected ? <View style={styles.dot} /> : null}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  circle: {
    alignItems: "center",
    justifyContent: "center",
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderRadius: theme.radius.full,
    variants: {
      isSelected: {
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
  dot: {
    width: 10,
    height: 10,
    borderRadius: theme.radius.full,
    variants: {
      isDisabled: {
        true: { backgroundColor: theme.colors.onDisabled },
        false: { backgroundColor: theme.colors.onPrimary },
      },
    },
  },
}));
