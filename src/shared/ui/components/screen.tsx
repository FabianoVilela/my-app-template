import { HeaderHeightContext } from "expo-router/react-navigation";
import { type ReactNode, use } from "react";
import { KeyboardAvoidingView, ScrollView, View } from "react-native";
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
 * Screen container: theme background, 20 pt horizontal padding, the device
 * safe areas for the requested edges, and room for the keyboard.
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

  // Under a navigator header the keyboard offset must include its height.
  const headerHeight = use(HeaderHeightContext) ?? 0;

  return (
    // Expo apps are edge-to-edge, so the Android window no longer resizes for
    // the keyboard: both platforms need `padding`.
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={headerHeight}
      style={styles.background}
    >
      {isScrollable ? (
        <UniScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </UniScrollView>
      ) : (
        <View style={styles.content}>{children}</View>
      )}
    </KeyboardAvoidingView>
  );
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
