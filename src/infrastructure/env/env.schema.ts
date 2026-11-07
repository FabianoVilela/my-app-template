import * as z from "zod";

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
            /^\/\d+$/.test(url.pathname) &&
            !url.search &&
            !url.hash,
        );
      })
      .optional(),
  ),
  defaultLocale: z.enum(["en", "pt-BR"]).catch("en"),
});

export type Env = z.infer<typeof envSchema>;
