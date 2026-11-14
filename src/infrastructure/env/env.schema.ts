import * as z from "zod";
import { APP_LOCALES } from "@/shared/i18n/contracts";

/** Mirrors VARIANTS in scripts/app-versions.cjs; read-env.test.ts checks parity. */
export const APP_VARIANTS = ["development", "staging", "production"] as const;

export const envSchema = z.object({
  apiUrl: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.url({ protocol: /^https?$/ }).optional(),
  ),
  sentryDsn: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z
      .url({ protocol: /^https?$/ })
      .refine((value) => {
        let url: URL;
        try {
          url = new URL(value);
        } catch {
          return false;
        }
        return Boolean(
          url.username &&
            !url.password &&
            // Self-hosted Sentry may serve under a path prefix: /sentry/<id>.
            /^(?:\/[^/]+)*\/\d+$/.test(url.pathname) &&
            !url.search &&
            !url.hash,
        );
      })
      .optional(),
  ),
  defaultLocale: z.enum(APP_LOCALES).catch(APP_LOCALES[0]),
  // app.config.ts always sets the variant; test and tool contexts omit it.
  appVariant: z.enum(APP_VARIANTS).default("development"),
  // Build-time selection from app.config.ts; native SDKs are linked only when true.
  firebase: z
    .object({ analytics: z.boolean(), crashlytics: z.boolean() })
    .default({ analytics: false, crashlytics: false }),
});

export type Env = z.infer<typeof envSchema>;
