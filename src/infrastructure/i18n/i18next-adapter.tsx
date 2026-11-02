import "intl-pluralrules";
import { createInstance } from "i18next";
import type { ReactElement } from "react";
import { Trans } from "react-i18next";
import type {
  AppI18n,
  AppLocale,
  AppLocalePreference,
  AppLocaleSnapshot,
  AppTranslate,
  AppTranslationKey,
} from "@/shared/i18n/contracts";
import type { LocalStorage } from "../storage/local-storage";
import enCommon from "./locales/en/common.json";
import enNavigation from "./locales/en/navigation.json";
import ptCommon from "./locales/pt-br/common.json";
import ptNavigation from "./locales/pt-br/navigation.json";

const PREFERENCE_KEY = "i18n.locale-preference";
const SUPPORTED_LOCALES: AppLocale[] = ["en", "pt-BR"];

function isPreference(value: unknown): value is AppLocalePreference {
  return (
    value === "system" || SUPPORTED_LOCALES.some((locale) => locale === value)
  );
}

export function resolveAppLocale(
  locales: readonly string[],
  defaultLocale: AppLocale = "en",
): AppLocale {
  for (const tag of locales) {
    const normalized = tag.toLowerCase();
    const exact = SUPPORTED_LOCALES.find(
      (locale) => locale.toLowerCase() === normalized,
    );

    if (exact) return exact;
    if (normalized.split("-")[0] === "pt") return "pt-BR";
    if (normalized.split("-")[0] === "en") return "en";
  }

  return defaultLocale;
}

export async function createI18nextAdapter({
  defaultLocale = "en",
  storage,
  getDeviceLocales,
  onReadError,
}: {
  defaultLocale?: AppLocale;
  storage: LocalStorage;
  getDeviceLocales: () => readonly string[];
  onReadError: (error: unknown) => void;
}) {
  let preference: AppLocalePreference = "system";

  try {
    const stored = storage.getItem(PREFERENCE_KEY);

    if (isPreference(stored)) preference = stored;
  } catch (error: unknown) {
    onReadError(error);
  }

  const resolve = () =>
    preference === "system"
      ? resolveAppLocale(getDeviceLocales(), defaultLocale)
      : preference;
  const instance = createInstance();

  await instance.init({
    lng: resolve(),
    fallbackLng: defaultLocale,
    supportedLngs: SUPPORTED_LOCALES,
    defaultNS: "common",
    ns: ["common", "navigation"],
    resources: {
      "pt-BR": { common: ptCommon, navigation: ptNavigation },
      en: { common: enCommon, navigation: enNavigation },
    },
    interpolation: { escapeValue: false },
    react: { transSupportBasicHtmlNodes: false },
    returnNull: false,
  });

  let snapshot: AppLocaleSnapshot = { locale: resolve(), preference };
  const listeners = new Set<() => void>();
  let pending = Promise.resolve();

  function enqueue(operation: () => Promise<void>) {
    const next = pending.then(operation);
    pending = next.catch(() => undefined);

    return next;
  }

  async function update() {
    const locale = resolve();
    await instance.changeLanguage(locale);
    snapshot = { locale, preference };
    for (const listener of listeners) listener();
  }

  const runtime: AppI18n = {
    translate: ((key: string, values?: Record<string, string | number>) =>
      instance.t(key, values)) as AppTranslate,
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setPreference(next) {
      return enqueue(async () => {
        if (!isPreference(next))
          throw new RangeError("Unsupported locale preference");

        // Persist first: a failed write rejects without claiming a preference change.
        storage.setItem(PREFERENCE_KEY, next);
        preference = next;
        await update();
      });
    },
    refreshDeviceLocale: () =>
      enqueue(async () => {
        if (preference === "system") await update();
      }),
  };
  function renderRichText({
    message,
    values,
    components,
  }: {
    message: AppTranslationKey;
    values?: Record<string, string | number>;
    components: Record<string, ReactElement>;
  }) {
    return (
      <Trans
        i18n={instance}
        t={instance.getFixedT(snapshot.locale)}
        i18nKey={message}
        values={values}
        count={typeof values?.count === "number" ? values.count : undefined}
        components={components}
      />
    );
  }

  return { runtime, renderRichText };
}
