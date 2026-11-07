import type { AppMessages } from "./app-messages";

/**
 * Supported locales; the first is the fallback when none is configured.
 * Add a locale here, in its catalog directory and in app.json supportedLocales.
 */
export const APP_LOCALES = ["en", "pt-BR"] as const;
export type AppLocale = (typeof APP_LOCALES)[number];
export type AppLocalePreference = AppLocale | "system";
export type AppTranslationKey = keyof AppMessages;
export type AppNamespace = AppTranslationKey extends `${infer N}:${string}`
  ? N
  : never;

type Variables<S extends string> =
  S extends `${string}{{${infer V}}}${infer Rest}`
    ? V | Variables<Rest>
    : never;

export type AppTranslationValues<K extends AppTranslationKey> = {
  [V in Variables<AppMessages[K]>]: V extends "count"
    ? number
    : string | number;
};

export type AppTranslationArgs<K extends AppTranslationKey> =
  keyof AppTranslationValues<K> extends never
    ? [values?: AppTranslationValues<K>]
    : [values: AppTranslationValues<K>];

export type AppTranslate = <K extends AppTranslationKey>(
  key: K,
  ...args: AppTranslationArgs<K>
) => string;

export type AppLocaleSnapshot = Readonly<{
  locale: AppLocale;
  preference: AppLocalePreference;
}>;

/** Pure application contract: no React, Expo or vendor types. */
export interface AppI18n {
  translate: AppTranslate;
  getSnapshot(): AppLocaleSnapshot;
  subscribe(listener: () => void): () => void;
  setPreference(preference: AppLocalePreference): Promise<void>;
  refreshDeviceLocale(): Promise<void>;
}
