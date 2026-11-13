import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { OptionLabel, OptionRow } from "./option-row";
import { useRadioGroup } from "./radio-group";

export type RadioButtonProps = {
  /** Identifies this option within its `RadioGroup`. */
  value: string;
  label: string;
  isDisabled?: boolean;
};

/** One option of a `RadioGroup`; pressing it never clears the selection. */
export function RadioButton({
  value,
  label,
  isDisabled = false,
}: RadioButtonProps) {
  const { state, actions } = useRadioGroup();
  const isSelected = state.value === value;

  styles.useVariants({ isSelected, isDisabled });

  return (
    <OptionRow
      role="radio"
      label={label}
      isChecked={isSelected}
      isDisabled={isDisabled}
      onPress={() => {
        if (!isSelected) actions.select(value);
      }}
    >
      <View style={styles.circle}>
        {isSelected ? <View style={styles.dot} /> : null}
      </View>
      <OptionLabel isDisabled={isDisabled}>{label}</OptionLabel>
    </OptionRow>
  );
}

const styles = StyleSheet.create((theme) => ({
  circle: {
    alignItems: "center",
    justifyContent: "center",
    width: theme.size.selectionControl,
    height: theme.size.selectionControl,
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
