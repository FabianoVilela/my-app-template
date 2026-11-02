import { useAppI18nContext } from "./app-translation-provider";
import type {
  AppNamespace,
  AppTranslationArgs,
  AppTranslationKey,
} from "./contracts";

export function useAppTranslation<N extends AppNamespace>(namespace: N) {
  const { runtime } = useAppI18nContext();

  type Key = AppTranslationKey extends infer K
    ? K extends `${N}:${infer S}`
      ? S
      : never
    : never;

  function t<K extends Key>(
    key: K,
    ...args: AppTranslationArgs<Extract<AppTranslationKey, `${N}:${K}`>>
  ) {
    // The namespace/key pair is checked by this public signature.
    const translate = runtime.translate as (
      key: string,
      values?: object,
    ) => string;
    return translate(`${namespace}:${key}`, args[0]);
  }

  return { t };
}
