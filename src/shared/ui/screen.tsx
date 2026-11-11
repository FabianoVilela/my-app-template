import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";

/** Safe-area edges the screen pads. Omit `top` under a navigator header. */
export type ScreenEdge = "top" | "bottom";

export type ScreenProps = {
  children: ReactNode;
  /** Scrolls the content when it is taller than the window. */
  isScrollable?: boolean;
  /** Defaults to both edges. */
  edges?: readonly ScreenEdge[];
};

const UniScrollView = withUnistyles(ScrollView);

/**
 * Screen container: theme background, 20 pt horizontal padding and the
 * device safe areas for the requested edges.
 */
export function Screen({
  children,
  isScrollable = false,
  edges = ["top", "bottom"],
}: ScreenProps) {
  styles.useVariants({
    top: edges.includes("top"),
    bottom: edges.includes("bottom"),
  });

  if (isScrollable) {
    return (
      <UniScrollView
        style={styles.background}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </UniScrollView>
    );
  }

  return <View style={[styles.background, styles.content]}>{children}</View>;
}

const styles = StyleSheet.create((theme, rt) => ({
  background: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
    paddingLeft: rt.insets.left + theme.spacing[5],
    paddingRight: rt.insets.right + theme.spacing[5],
    variants: {
      top: {
        true: { paddingTop: rt.insets.top + theme.spacing[4] },
        false: { paddingTop: theme.spacing[4] },
      },
      bottom: {
        true: { paddingBottom: rt.insets.bottom + theme.spacing[6] },
        false: { paddingBottom: theme.spacing[6] },
      },
    },
  },
}));
