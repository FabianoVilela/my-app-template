jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { appVariant: "staging" } } },
}));

import { APP_VARIANTS } from "./env.schema";
import { parseEnv, readEnv } from "./read-env";

test.each([undefined, ""])("allows an absent API URL (%j)", (apiUrl) => {
  expect(parseEnv({ apiUrl })).toEqual({
    defaultLocale: "en",
    appVariant: "development",
  });
});

test.each([
  "https://api.example.test/v1",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://10.0.2.2:3000",
  "http://192.168.1.10:3000",
])("accepts HTTP API URL %s", (apiUrl) => {
  expect(parseEnv({ apiUrl }).apiUrl).toBe(apiUrl);
});

test.each([undefined, "", "fr", "pt-br"])(
  "preserves the English fallback for locale %j",
  (defaultLocale) => {
    expect(parseEnv({ defaultLocale }).defaultLocale).toBe("en");
  },
);

test.each(["en", "pt-BR"])("accepts supported locale %s", (defaultLocale) => {
  expect(parseEnv({ defaultLocale }).defaultLocale).toBe(defaultLocale);
});

test.each(["invalid", " ", "ftp://example.test", "mailto:user@example.test"])(
  "rejects invalid or unsupported API URL %s",
  (apiUrl) => {
    expect(() => parseEnv({ apiUrl })).toThrow("EXPO_PUBLIC_API_URL");
  },
);

test("does not expose invalid configuration values or vendor errors", () => {
  const input = "ftp://user:private-password@example.test";

  try {
    parseEnv({ apiUrl: input });
    throw new Error("Expected parsing to fail");
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    expect(String(error)).toContain("EXPO_PUBLIC_API_URL");
    expect(String(error)).not.toContain(input);
    expect(error).not.toHaveProperty("cause");
  }
});

test("reads public Expo configuration explicitly", () => {
  const previous = { ...process.env };

  try {
    process.env.EXPO_PUBLIC_API_URL = "http://localhost:3000";
    process.env.EXPO_PUBLIC_DEFAULT_LOCALE = "pt-BR";
    expect(readEnv()).toEqual({
      apiUrl: "http://localhost:3000",
      defaultLocale: "pt-BR",
      appVariant: "staging",
    });
  } finally {
    process.env = previous;
  }
});

const validDsn = "https://public-key@o123.ingest.sentry.io/456";

test.each([undefined, ""])(
  "allows absent Sentry configuration (%j)",
  (sentryDsn) => {
    expect(parseEnv({ sentryDsn }).sentryDsn).toBeUndefined();
  },
);

test("accepts a public DSN", () => {
  expect(parseEnv({ sentryDsn: validDsn }).sentryDsn).toBe(validDsn);
});

test.each([
  "malformed-private-dsn",
  "https://example.test/123",
  "https://key:secret@example.test/123",
  "https://key@example.test/123?token=secret",
])("rejects invalid DSNs without exposing their values", (sentryDsn) => {
  expect(() => parseEnv({ sentryDsn })).toThrow("EXPO_PUBLIC_SENTRY_DSN");
  expect(() => parseEnv({ sentryDsn })).not.toThrow(sentryDsn);
});

test("app variants match the list used by app config and scripts", () => {
  const { VARIANTS } = jest.requireActual<{ VARIANTS: readonly string[] }>(
    "../../../scripts/app-versions.cjs",
  );

  expect(APP_VARIANTS).toEqual(VARIANTS);
});

test.each(APP_VARIANTS)("accepts app variant %s", (appVariant) => {
  expect(parseEnv({ appVariant }).appVariant).toBe(appVariant);
});

test.each(["", "qa", "Production"])(
  "rejects unknown app variant %j",
  (appVariant) => {
    expect(() => parseEnv({ appVariant })).toThrow(
      "APP_VARIANT: invalid_value",
    );
  },
);
