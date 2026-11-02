import { type Env, envSchema } from "./env.schema";

const ENV_NAMES: Record<string, string> = {
  apiUrl: "EXPO_PUBLIC_API_URL",
  defaultLocale: "EXPO_PUBLIC_DEFAULT_LOCALE",
};

export function parseEnv(input: unknown): Env {
  const result = envSchema.safeParse(input);

  if (!result.success) {
    const fields = result.error.issues.map((issue) => {
      const field = ENV_NAMES[String(issue.path[0])] ?? "environment";
      return `${field}: ${issue.code}`;
    });

    // Do not attach the input or vendor error: URLs can contain credentials.
    throw new Error(`Invalid environment configuration (${fields.join(", ")})`);
  }

  return result.data;
}

export function readEnv(): Env {
  return parseEnv({
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    defaultLocale: process.env.EXPO_PUBLIC_DEFAULT_LOCALE,
  });
}
