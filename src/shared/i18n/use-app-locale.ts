import { useAppI18nContext } from "./app-translation-provider";

export function useAppLocale() {
  const { runtime, locale, preference } = useAppI18nContext();
  return { locale, preference, setPreference: runtime.setPreference };
}
