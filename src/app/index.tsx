import { StyleSheet, Text, View } from "react-native";
import { useAppTranslation } from "@/shared/i18n";

export default function Index() {
  const { t } = useAppTranslation("common");

  return (
    <View style={styles.container}>
      <Text>{t("editScreen", { file: "src/app/index.tsx" })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
