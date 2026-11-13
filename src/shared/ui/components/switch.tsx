import { useEffect, useState } from "react";
import { Animated, Easing, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { motion } from "../theme";
import { useReducedMotion } from "../use-reduced-motion";
import { OptionLabel, OptionRow } from "./option-row";

export type SwitchProps = {
  label: string;
  isOn: boolean;
  onValueChange: (isOn: boolean) => void;
  isDisabled?: boolean;
};

const KNOB_TRAVEL = 18;

/** Immediate on/off setting, laid out as a row with the switch trailing. */
export function Switch({
  label,
  isOn,
  onValueChange,
  isDisabled = false,
}: SwitchProps) {
  const isReducedMotion = useReducedMotion();
  const [offset] = useState(() => new Animated.Value(isOn ? KNOB_TRAVEL : 0));

  styles.useVariants({ isOn, isDisabled });

  useEffect(() => {
    const animation = Animated.timing(offset, {
      toValue: isOn ? KNOB_TRAVEL : 0,
      duration: isReducedMotion ? 0 : motion.duration.base,
      easing: Easing.bezier(...motion.easing),
      useNativeDriver: true,
    });

    animation.start();

    return () => animation.stop();
  }, [isOn, isReducedMotion, offset]);

  return (
    <OptionRow
      role="switch"
      label={label}
      isChecked={isOn}
      isDisabled={isDisabled}
      onPress={() => onValueChange(!isOn)}
    >
      <OptionLabel isDisabled={isDisabled}>{label}</OptionLabel>
      <View style={styles.track}>
        <Animated.View
          style={[styles.knob, { transform: [{ translateX: offset }] }]}
        />
      </View>
    </OptionRow>
  );
}

const styles = StyleSheet.create((theme) => ({
  track: {
    width: 46,
    height: 28,
    padding: 3,
    borderRadius: theme.radius.full,
    variants: {
      isOn: {
        true: { backgroundColor: theme.colors.primary },
        false: { backgroundColor: theme.colors.borderStrong },
      },
      isDisabled: {
        true: { backgroundColor: theme.colors.disabled },
      },
    },
  },
  knob: {
    width: 22,
    height: 22,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.knob,
    variants: {
      isDisabled: {
        true: { opacity: 0.6 },
        false: { boxShadow: theme.shadows.knob },
      },
    },
  },
}));
