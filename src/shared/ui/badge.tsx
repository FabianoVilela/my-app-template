import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "./text";

export type BadgeTone =
  | "neutral"
  | "primary"
  | "highlight"
  | "success"
  | "warning"
  | "danger"
  | "info";

export type BadgeProps = {
  label: string;
  /** Defaults to `neutral`. */
  tone?: BadgeTone;
  /** Shows a leading status dot in the tone color. */
  hasDot?: boolean;
};

/** Short, non-interactive status label on a soft pill. */
export function Badge({ label, tone = "neutral", hasDot = false }: BadgeProps) {
  styles.useVariants({ tone });

  return (
    <View style={styles.pill}>
      {hasDot ? <View style={styles.dot} /> : null}
      <Text variant="caption" style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => {
  const tones = {
    neutral: [theme.colors.surfaceMuted, theme.colors.textSecondary],
    primary: [theme.colors.primarySoft, theme.colors.onPrimarySoft],
    highlight: [theme.colors.highlight, theme.colors.onHighlight],
    success: [theme.colors.successSoft, theme.colors.success],
    warning: [theme.colors.warningSoft, theme.colors.warning],
    danger: [theme.colors.dangerSoft, theme.colors.danger],
    info: [theme.colors.infoSoft, theme.colors.info],
  } satisfies Record<BadgeTone, [string, string]>;

  const pick = (index: 0 | 1, property: "backgroundColor" | "color") =>
    Object.fromEntries(
      Object.entries(tones).map(([tone, pair]) => [
        tone,
        { [property]: pair[index] },
      ]),
    ) as Record<BadgeTone, Record<typeof property, string>>;

  return {
    pill: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 6,
      height: 24,
      paddingHorizontal: 10,
      borderRadius: theme.radius.full,
      variants: { tone: pick(0, "backgroundColor") },
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: theme.radius.full,
      variants: { tone: pick(1, "backgroundColor") },
    },
    label: {
      fontWeight: "600",
      variants: { tone: pick(1, "color") },
    },
  };
});
