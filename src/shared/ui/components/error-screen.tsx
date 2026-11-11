import { Pressable, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export type ErrorScreenProps = {
  onRetry: () => void;
};

// Fixed bilingual text: translations may be the resource that failed to load.
const TITLE = "Something went wrong · Algo deu errado";
const MESSAGE =
  "Try again. If the problem continues, restart the app. · Tente novamente. Se o problema continuar, reinicie o app.";
const RETRY = "Try again · Tentar novamente";

/** Full-screen fallback for failures outside the translated UI. */
export function ErrorScreen({ onRetry }: ErrorScreenProps) {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        {TITLE}
      </Text>
      <Text style={styles.message}>{MESSAGE}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={styles.button}
      >
        <Text style={styles.buttonText}>{RETRY}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    justifyContent: "center",
    gap: theme.spacing[4],
    paddingTop: rt.insets.top + theme.spacing[6],
    paddingBottom: rt.insets.bottom + theme.spacing[6],
    paddingLeft: rt.insets.left + theme.spacing[6],
    paddingRight: rt.insets.right + theme.spacing[6],
    backgroundColor: theme.colors.background,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    textAlign: "center",
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    textAlign: "center",
  },
  button: {
    alignSelf: "center",
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: theme.spacing[6],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
  },
  buttonText: {
    ...theme.typography.button,
    color: theme.colors.onPrimary,
  },
}));
