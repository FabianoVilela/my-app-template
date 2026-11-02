import {
  createContext,
  type ReactElement,
  type ReactNode,
  useContext,
  useSyncExternalStore,
} from "react";
import type { AppI18n, AppTranslationKey } from "./contracts";

export type AppRichTextOptions = {
  message: AppTranslationKey;
  values?: Record<string, string | number>;
  components: Record<string, ReactElement>;
};
export type AppRichTextRenderer = (options: AppRichTextOptions) => ReactNode;
const AppTranslationContext = createContext<{
  runtime: AppI18n;
  renderRichText: AppRichTextRenderer;
} | null>(null);

export function AppTranslationProvider({
  runtime,
  renderRichText,
  children,
}: {
  runtime: AppI18n;
  renderRichText: AppRichTextRenderer;
  children: ReactNode;
}) {
  return (
    <AppTranslationContext value={{ runtime, renderRichText }}>
      {children}
    </AppTranslationContext>
  );
}

export function useAppI18nContext() {
  const context = useContext(AppTranslationContext);
  if (!context) throw new Error("AppTranslationProvider is required");
  const snapshot = useSyncExternalStore(
    context.runtime.subscribe,
    context.runtime.getSnapshot,
    context.runtime.getSnapshot,
  );
  return { ...context, ...snapshot };
}
