import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useAppTranslation } from "@/shared/i18n";

export default function Index() {
  const { t } = useAppTranslation("common");

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {t("editScreen", { file: "src/app/index.tsx" })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  text: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
}));
