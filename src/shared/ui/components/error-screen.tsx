import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Button } from "./button";
import { Text } from "./text";

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
      <Text variant="h2" style={styles.centered}>
        {TITLE}
      </Text>
      <Text color="textMuted" style={styles.centered}>
        {MESSAGE}
      </Text>
      <View style={styles.action}>
        <Button label={RETRY} onPress={onRetry} />
      </View>
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
  centered: {
    textAlign: "center",
  },
  action: {
    alignItems: "center",
  },
}));
