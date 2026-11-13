import { createContext, type ReactNode, use } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export type RadioGroupContextValue = {
  state: { value: string | undefined };
  actions: { select: (value: string) => void };
};

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

/** Reads the enclosing group; radio buttons cannot work alone. */
export function useRadioGroup(): RadioGroupContextValue {
  const context = use(RadioGroupContext);

  if (context === null) {
    throw new Error("RadioButton must be rendered inside a RadioGroup.");
  }

  return context;
}

export type RadioGroupProps = {
  /** Accessible name of the set of options. */
  label: string;
  /** Selected option; `undefined` when nothing is selected yet. */
  value: string | undefined;
  onValueChange: (value: string) => void;
  /** `RadioButton` items, optionally mixed with other content. */
  children: ReactNode;
};

/** Mutually exclusive options; owns the selection its items render. */
export function RadioGroup({
  label,
  value,
  onValueChange,
  children,
}: RadioGroupProps) {
  return (
    <RadioGroupContext
      value={{ state: { value }, actions: { select: onValueChange } }}
    >
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        style={styles.group}
      >
        {children}
      </View>
    </RadioGroupContext>
  );
}

const styles = StyleSheet.create({
  group: {
    alignSelf: "stretch",
  },
});
