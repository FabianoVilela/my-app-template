import { useState } from "react";
import type { NativeSyntheticEvent, TargetedEvent } from "react-native";

type FocusEvent = NativeSyntheticEvent<TargetedEvent>;

/** Tracks focus while still calling the caller's own handlers. */
export function useFieldFocus(
  onFocus?: (event: FocusEvent) => void,
  onBlur?: (event: FocusEvent) => void,
) {
  const [isFocused, setIsFocused] = useState(false);

  return {
    isFocused,
    onFocus: (event: FocusEvent) => {
      setIsFocused(true);
      onFocus?.(event);
    },
    onBlur: (event: FocusEvent) => {
      setIsFocused(false);
      onBlur?.(event);
    },
  };
}
