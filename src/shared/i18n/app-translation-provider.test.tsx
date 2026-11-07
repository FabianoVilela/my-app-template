import { act, render, renderHook, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { Text } from "react-native";
import { createI18nextAdapter } from "@/infrastructure/i18n/i18next-adapter";
import { AppTranslatedText } from "./app-translated-text";
import { AppTranslationProvider } from "./app-translation-provider";
import type { AppTranslate } from "./contracts";
import { useAppFormatting } from "./use-app-formatting";
import { useAppLocale } from "./use-app-locale";
import { useAppTranslation } from "./use-app-translation";

// Real adapter instances with fake persistence and device locales.
function setup() {
  return createI18nextAdapter({
    storage: {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    },
    getDeviceLocales: () => ["en-US"],
    onReadError: jest.fn(),
  });
}

function Greeting() {
  const { t } = useAppTranslation("common");
  return <Text>{t("editScreen", { file: "example.tsx" })}</Text>;
}

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
