import { spawn } from "node:child_process";
import { loadEnvFile } from "node:process";
import { isAppVariant, VARIANTS } from "./app-versions.cjs";

const [variant, ...args] = process.argv.slice(2);
if (!isAppVariant(variant) || args.length === 0) {
  console.error(
    `Usage: node scripts/expo-variant.mjs <${VARIANTS.join("|")}> <expo command> [args]`,
  );
  process.exit(1);
}

// Existing process variables win. Load most specific files first.
const files = [`.env.${variant}.local`, `.env.${variant}`];
if (variant === "development") files.push(".env.local", ".env");
for (const file of files) {
  try {
    loadEnvFile(file);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error(`Unable to load ${file}`);
      process.exit(1);
    }
  }
}

// Expo must not load .env.production based on its internal NODE_ENV.
process.env.APP_VARIANT = variant;
process.env.EXPO_NO_DOTENV = "1";
const child = spawn("pnpm", ["exec", "expo", ...args], {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
child.on("error", () => {
  console.error("Unable to start Expo through pnpm");
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal === "SIGINT" ? 130 : 1);
});
