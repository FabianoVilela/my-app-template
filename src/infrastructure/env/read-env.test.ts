import { parseEnv, readEnv } from "./read-env";

test.each([undefined, ""])("allows an absent API URL (%j)", (apiUrl) => {
  expect(parseEnv({ apiUrl })).toEqual({ defaultLocale: "en" });
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
    });
  } finally {
    process.env = previous;
  }
});
