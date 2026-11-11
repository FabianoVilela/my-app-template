import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "./text";

export type DividerProps = {
  /** Optional text centered on the line, such as "or". */
  label?: string;
};

/** A 1 px horizontal rule in the `border` color. */
export function Divider({ label }: DividerProps) {
  if (label === undefined) {
    return <View style={[styles.line, styles.fullLine]} />;
  }

  return (
    <View style={styles.labeled}>
      <View style={[styles.line, styles.flexLine]} />
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
      <View style={[styles.line, styles.flexLine]} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  line: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  fullLine: {
    alignSelf: "stretch",
  },
  labeled: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
  },
  flexLine: {
    flex: 1,
  },
}));
