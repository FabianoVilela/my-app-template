jest.mock("@/bootstrap/observability", () => ({
  initializeObservability: () => ({
    captureException: jest.fn(),
    addBreadcrumb: jest.fn(),
  }),
  withObservability: (component: unknown) => component,
}));

jest.mock("react-native-nitro-modules", () => ({}));

import { act } from "@testing-library/react-native";
import { renderRouter, screen } from "expo-router/testing-library";
import type { ReactNode } from "react";
import { AppNavigation } from "@/app/_layout";
import Index from "@/app/index";
import { createI18nextAdapter } from "@/infrastructure/i18n/i18next-adapter";
import { AppTranslationProvider } from "@/shared/i18n";

test("keeps the home URL while its content changes language", async () => {
  const dependencies = await createI18nextAdapter({
    storage: {
      getItem: () => "en",
      setItem: () => undefined,
      removeItem: () => undefined,
    },
    getDeviceLocales: () => [],
    onReadError: () => undefined,
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <AppTranslationProvider {...dependencies}>
      {children}
    </AppTranslationProvider>
  );
  const result = await renderRouter(
    { _layout: AppNavigation, index: Index },
    { initialUrl: "/", wrapper },
  );

  expect(result.getPathname()).toBe("/");
  expect(
    screen.getByText("Edit src/app/index.tsx to edit this screen."),
  ).toBeOnTheScreen();

  // Native headers expose title as configuration, not a Text node in Jest.
  expect(
    result.root?.queryAll(
      (node) => node.type === "RNSScreenStackHeaderConfig",
    )[0],
  ).toHaveProp("title", "Home");

  await act(() => dependencies.runtime.setPreference("pt-BR"));

  expect(
    result.root?.queryAll(
      (node) => node.type === "RNSScreenStackHeaderConfig",
    )[0],
  ).toHaveProp("title", "Início");
  expect(result.getPathname()).toBe("/");
  expect(
    screen.getByText("Edite src/app/index.tsx para editar esta tela."),
  ).toBeOnTheScreen();
});
