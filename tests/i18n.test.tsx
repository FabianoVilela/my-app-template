import { act, render, renderHook, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { Text } from "react-native";
import {
  createI18nextAdapter,
  resolveAppLocale,
} from "@/infrastructure/i18n/i18next-adapter";
import type { LocalStorage } from "@/infrastructure/storage/local-storage";
import {
  AppTranslatedText,
  AppTranslationProvider,
  useAppFormatting,
  useAppLocale,
  useAppTranslation,
} from "@/shared/i18n";
import type { AppTranslate } from "@/shared/i18n/contracts";

function memoryStorage(initial: string | null = null): LocalStorage {
  let value = initial;
  return {
    getItem: () => value,
    setItem: (_key, next) => {
      value = next;
    },
    removeItem: () => {
      value = null;
    },
  };
}

async function setup(
  storage = memoryStorage(),
  getDeviceLocales = () => ["en-US"],
) {
  return createI18nextAdapter({
    storage,
    getDeviceLocales,
    onReadError: jest.fn(),
  });
}
function Greeting() {
  const { t } = useAppTranslation("common");
  return <Text>{t("editScreen", { file: "example.tsx" })}</Text>;
}

test.each([
  [["fr-FR", "en-GB"], "en"],
  [["pt-PT"], "pt-BR"],
  [[], "en"],
  [["ja-JP"], "en"],
])("resolves supported device locales %j", (locales, expected) => {
  expect(resolveAppLocale(locales)).toBe(expected);
});

test("uses an injected fallback locale while preserving device and saved preference priority", async () => {
  const dependencies = await createI18nextAdapter({
    defaultLocale: "pt-BR",
    storage: memoryStorage(),
    getDeviceLocales: () => ["fr-FR"],
    onReadError: jest.fn(),
  });

  expect(dependencies.runtime.getSnapshot().locale).toBe("pt-BR");
  expect(resolveAppLocale([], "pt-BR")).toBe("pt-BR");
  expect(resolveAppLocale(["en-US"], "pt-BR")).toBe("en");

  await dependencies.runtime.setPreference("en");
  await dependencies.runtime.refreshDeviceLocale();

  expect(dependencies.runtime.getSnapshot().locale).toBe("en");
});

test("restores an explicit preference and persists system mode across restarts", async () => {
  const storage = memoryStorage("pt-BR");
  let device = ["en-US"];
  const first = await setup(storage, () => device);

  expect(first.runtime.getSnapshot().locale).toBe("pt-BR");
  await first.runtime.setPreference("system");
  expect(first.runtime.getSnapshot().locale).toBe("en");

  device = ["pt-PT"];
  await first.runtime.refreshDeviceLocale();
  expect(first.runtime.getSnapshot().locale).toBe("pt-BR");
  const restarted = await setup(storage, () => device);
  expect(restarted.runtime.getSnapshot().preference).toBe("system");
  await first.runtime.setPreference("en");
  await first.runtime.refreshDeviceLocale();
  expect(first.runtime.getSnapshot().locale).toBe("en");
});

test("ignores invalid saved preferences and reports failed reads", async () => {
  expect(
    (await setup(memoryStorage("unknown"))).runtime.getSnapshot().locale,
  ).toBe("en");

  const onReadError = jest.fn();
  const failure = new Error("read");
  const dependencies = await createI18nextAdapter({
    storage: {
      ...memoryStorage(),
      getItem: () => {
        throw failure;
      },
    },
    getDeviceLocales: () => [],
    onReadError,
  });

  expect(onReadError).toHaveBeenCalledWith(failure);
  expect(dependencies.runtime.getSnapshot().locale).toBe("en");
});

test("failed writes preserve visible state and later operations can succeed", async () => {
  const storage = memoryStorage();
  const { runtime } = await setup(storage);
  const listener = jest.fn();
  const unsubscribe = runtime.subscribe(listener);

  jest.spyOn(storage, "setItem").mockImplementationOnce(() => {
    throw new Error("write");
  });

  await expect(runtime.setPreference("pt-BR")).rejects.toThrow("write");

  expect(runtime.getSnapshot().locale).toBe("en");
  expect(listener).not.toHaveBeenCalled();

  await Promise.all([
    runtime.setPreference("pt-BR"),
    runtime.setPreference("en"),
  ]);

  expect(runtime.getSnapshot()).toEqual({ locale: "en", preference: "en" });
  unsubscribe();

  await runtime.setPreference("system");

  expect(listener).toHaveBeenCalledTimes(2);
});

test("real resources interpolate and resolve locale-specific plurals", async () => {
  const { runtime } = await setup();

  expect(
    runtime.translate("common:editScreen", { file: "index.tsx" }),
  ).toContain("index.tsx");
  expect(runtime.translate("common:items", { count: 1 })).toBe("1 item");
  expect(runtime.translate("common:items", { count: 2 })).toBe("2 items");

  await runtime.setPreference("pt-BR");

  expect(runtime.translate("common:items", { count: 0 })).toBe("0 item");
  expect(runtime.translate("common:items", { count: 2 })).toBe("2 itens");
  expect(runtime.translate("common:items", { count: 1000000 })).toBe(
    "1000000 itens",
  );
});

test("hooks and rich text react to locale changes without remounting", async () => {
  const dependencies = await setup();

  await render(
    <AppTranslationProvider {...dependencies}>
      <Greeting />
      <AppTranslatedText
        message="common:learnMore"
        components={{ action: <Text accessibilityRole="link" /> }}
      />
    </AppTranslationProvider>,
  );

  expect(
    screen.getByText("Edit example.tsx to edit this screen."),
  ).toBeOnTheScreen();
  expect(screen.getByRole("link")).toHaveTextContent("more information");

  await act(() => dependencies.runtime.setPreference("pt-BR"));

  expect(
    screen.getByText("Edite example.tsx para editar esta tela."),
  ).toBeOnTheScreen();
  expect(screen.getByRole("link")).toHaveTextContent("mais informações");
});

test("formatting follows locale while currency and time zone remain explicit", async () => {
  const dependencies = await setup();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AppTranslationProvider {...dependencies}>
      {children}
    </AppTranslationProvider>
  );

  const { result } = await renderHook(
    () => ({ formatting: useAppFormatting(), locale: useAppLocale() }),
    { wrapper },
  );

  expect(result.current.formatting.percent(0.15)).toBe("15%");
  expect(result.current.formatting.currency(12, "BRL")).toContain("12.00");
  expect(
    result.current.formatting.date(new Date("2025-01-01T23:00:00Z"), {
      timeZone: "UTC",
      year: "numeric",
    }),
  ).toBe("2025");

  await act(() => result.current.locale.setPreference("pt-BR"));
  expect(result.current.formatting.number(1234.5)).toBe("1.234,5");
  expect(result.current.formatting.currency(12, "BRL")).toContain("12,00");
});

// This function is deliberately never invoked; tsc verifies the public contract.
function checkTranslationTypes(t: AppTranslate) {
  // @ts-expect-error Unknown message key.
  t("common:missing");
  // @ts-expect-error Required interpolation variable.
  t("common:editScreen");
  // @ts-expect-error Count must be numeric.
  t("common:items", { count: "two" });
}

void checkTranslationTypes;
