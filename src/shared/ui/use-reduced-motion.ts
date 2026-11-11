import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/** Whether the OS asks apps to minimize motion; follows changes live. */
export function useReducedMotion() {
  const [isReduced, setIsReduced] = useState(false);

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (isMounted) setIsReduced(value);
      })
      .catch(() => undefined);

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setIsReduced,
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return isReduced;
}
