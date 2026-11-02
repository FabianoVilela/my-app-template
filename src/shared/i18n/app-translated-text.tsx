import type { ReactElement } from "react";
import { Text, type TextProps } from "react-native";
import { useAppI18nContext } from "./app-translation-provider";
import type { AppTranslationKey, AppTranslationValues } from "./contracts";

type MessageProps<K extends AppTranslationKey> =
  keyof AppTranslationValues<K> extends never
    ? { values?: AppTranslationValues<K> }
    : { values: AppTranslationValues<K> };
export type AppTranslatedTextProps<K extends AppTranslationKey> = TextProps &
  MessageProps<K> & {
    message: K;
    components: Record<string, ReactElement>;
  };

export function AppTranslatedText<K extends AppTranslationKey>({
  message,
  values,
  components,
  ...props
}: AppTranslatedTextProps<K>) {
  const { renderRichText } = useAppI18nContext();
  return (
    <Text {...props}>{renderRichText({ message, values, components })}</Text>
  );
}
