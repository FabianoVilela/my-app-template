import Constants from "expo-constants";
import { type Env, envSchema } from "./env.schema";

const ENV_NAMES: Record<keyof Env, string> = {
  sentryDsn: "EXPO_PUBLIC_SENTRY_DSN",
  apiUrl: "EXPO_PUBLIC_API_URL",
  defaultLocale: "EXPO_PUBLIC_DEFAULT_LOCALE",
  appVariant: "APP_VARIANT",
  firebase: "FIREBASE_SERVICES",
};

function isEnvField(value: unknown): value is keyof Env {
  return typeof value === "string" && Object.hasOwn(ENV_NAMES, value);
}

export function parseEnv(input: unknown): Env {
  const result = envSchema.safeParse(input);

  if (!result.success) {
    const fields = result.error.issues.map((issue) => {
      const [key] = issue.path;
      const field = isEnvField(key) ? ENV_NAMES[key] : "environment";
      return `${field}: ${issue.code}`;
    });

    // Do not attach the input or vendor error: URLs can contain credentials.
    throw new Error(`Invalid environment configuration (${fields.join(", ")})`);
  }

  return result.data;
}

export function readEnv(): Env {
  return parseEnv({
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    defaultLocale: process.env.EXPO_PUBLIC_DEFAULT_LOCALE,
    // Set by app.config.ts from APP_VARIANT; not an EXPO_PUBLIC_ variable.
    appVariant: Constants.expoConfig?.extra?.appVariant,
    // Set by app.config.ts from FIREBASE_SERVICES; not an EXPO_PUBLIC_ variable.
    firebase: Constants.expoConfig?.extra?.firebase,
  });
}
