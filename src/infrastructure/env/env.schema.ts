import * as z from "zod";

export const envSchema = z.object({
  apiUrl: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.url({ protocol: /^https?$/ }).optional(),
  ),
  defaultLocale: z.enum(["en", "pt-BR"]).catch("en"),
});

export type Env = z.infer<typeof envSchema>;
