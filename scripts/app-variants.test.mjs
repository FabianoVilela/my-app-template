import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import appConfig from "../app.config.ts";

const BASE = JSON.parse(
  readFileSync(new URL("../app.json", import.meta.url)),
).expo;
const VERSIONS = JSON.parse(
  readFileSync(new URL("../app-versions.json", import.meta.url)),
);
const RUNNER = fileURLToPath(new URL("./expo-variant.mjs", import.meta.url));

for (const [variant, suffix, label] of [
  ["development", ".dev", " (Dev)"],
  ["staging", ".staging", " (Staging)"],
  ["production", "", ""],
]) {
  test(`${variant} resolves identity and preserves plugins and base config`, (context) => {
    const previous = process.env.APP_VARIANT;
    context.after(() => {
      if (previous === undefined) delete process.env.APP_VARIANT;
      else process.env.APP_VARIANT = previous;
    });
    process.env.APP_VARIANT = variant;
    const original = structuredClone(BASE);
    const config = appConfig({ config: BASE });
    assert.equal(config.name, BASE.name + label);
    assert.equal(config.scheme, BASE.scheme + suffix);
    assert.equal(
      config.ios.bundleIdentifier,
      BASE.ios.bundleIdentifier + suffix,
    );
    assert.equal(config.android.package, BASE.android.package + suffix);
    assert.equal(config.slug, BASE.slug);
    assert.equal(config.version, VERSIONS[variant].version);
    assert.equal(config.ios.buildNumber, String(VERSIONS[variant].build));
    assert.equal(config.android.versionCode, VERSIONS[variant].build);
    assert.deepEqual(config.plugins, BASE.plugins);
    assert.deepEqual(BASE, original);
    const renamed = appConfig({
      config: {
        ...BASE,
        name: "Renamed",
        scheme: "renamed",
        ios: {
          ...BASE.ios,
          bundleIdentifier: "com.example.renamed",
          infoPlist: { CFBundleDisplayName: "Renamed", Other: true },
        },
        android: { ...BASE.android, package: "com.example.renamed" },
      },
    });
    assert.equal(renamed.name, `Renamed${label}`);
    assert.equal(renamed.ios.bundleIdentifier, `com.example.renamed${suffix}`);
    assert.equal(renamed.ios.infoPlist.CFBundleDisplayName, `Renamed${label}`);
    assert.equal(renamed.ios.infoPlist.Other, true);
  });
}

test("defaults to development and rejects unknown or incomplete identities", (context) => {
  const previous = process.env.APP_VARIANT;
  context.after(() => {
    if (previous === undefined) delete process.env.APP_VARIANT;
    else process.env.APP_VARIANT = previous;
  });
  delete process.env.APP_VARIANT;
  assert.equal(appConfig({ config: BASE }).name, `${BASE.name} (Dev)`);
  process.env.APP_VARIANT = "typo";
  assert.throws(() => appConfig({ config: BASE }), /APP_VARIANT/);
  process.env.APP_VARIANT = "production";
  assert.throws(() => appConfig({ config: {} }), /base app identity/);
});

function fixture(context) {
  const root = mkdtempSync(join(tmpdir(), "app-variants-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "bin"));
  writeFileSync(
    join(root, "bin/pnpm"),
    `#!${process.execPath}
process.stdout.write(JSON.stringify({ args: process.argv.slice(2), variant: process.env.APP_VARIANT, noDotenv: process.env.EXPO_NO_DOTENV, api: process.env.EXPO_PUBLIC_API_URL, locale: process.env.EXPO_PUBLIC_DEFAULT_LOCALE }));
process.exit(Number(process.env.TEST_EXIT_CODE || 0));
`,
    { mode: 0o755 },
  );
  if (process.platform === "win32") {
    writeFileSync(
      join(root, "bin/pnpm.cmd"),
      `@"${process.execPath}" "${join(root, "bin/pnpm")}" %*\r\n`,
    );
  }
  const env = {
    ...process.env,
    PATH: `${join(root, "bin")}${delimiter}${process.env.PATH}`,
  };
  delete env.EXPO_PUBLIC_API_URL;
  delete env.EXPO_PUBLIC_DEFAULT_LOCALE;
  const write = (file, content) => writeFileSync(join(root, file), content);
  const run = (variant, overrides = {}, args = ["config", "--json"]) =>
    spawnSync(process.execPath, [RUNNER, variant, ...args], {
      cwd: root,
      encoding: "utf8",
      env: { ...env, ...overrides },
    });
  return { write, run };
}

test("selects variant files independently of NODE_ENV and isolates production", (context) => {
  const { write, run } = fixture(context);
  write(".env", "EXPO_PUBLIC_API_URL=https://dev.example.test");
  write(".env.local", "EXPO_PUBLIC_DEFAULT_LOCALE=pt-BR");
  write(".env.staging", "EXPO_PUBLIC_API_URL=https://staging.example.test");
  write(
    ".env.staging.local",
    "EXPO_PUBLIC_API_URL=https://override.example.test",
  );
  write(".env.production", "EXPO_PUBLIC_DEFAULT_LOCALE=en");
  const dev = JSON.parse(run("development", { NODE_ENV: "production" }).stdout);
  assert.equal(dev.api, "https://dev.example.test");
  assert.equal(dev.locale, "pt-BR");
  write(
    ".env.development",
    "EXPO_PUBLIC_API_URL=https://development.example.test",
  );
  write(
    ".env.development.local",
    "EXPO_PUBLIC_API_URL=https://dev-local.example.test",
  );
  assert.equal(
    JSON.parse(run("development").stdout).api,
    "https://dev-local.example.test",
  );
  const staging = JSON.parse(run("staging").stdout);
  assert.equal(staging.api, "https://override.example.test");
  assert.equal(staging.locale, undefined);
  assert.equal(staging.variant, "staging");
  assert.equal(staging.noDotenv, "1");
  assert.deepEqual(staging.args, ["exec", "expo", "config", "--json"]);
  const production = JSON.parse(run("production").stdout);
  assert.equal(production.api, undefined);
  assert.equal(production.locale, "en");
  const explicit = JSON.parse(
    run("staging", {
      EXPO_PUBLIC_API_URL: "https://ci.example.test",
      APP_VARIANT: "production",
    }).stdout,
  );
  assert.equal(explicit.api, "https://ci.example.test");
  assert.equal(explicit.variant, "staging");
});

test("starts without env files, rejects unknown variants, forwards arguments and exit codes", (context) => {
  const { run } = fixture(context);
  const result = run("production", {}, [
    "run:ios",
    "--configuration",
    "Release",
  ]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).api, undefined);
  assert.deepEqual(JSON.parse(result.stdout).args, [
    "exec",
    "expo",
    "run:ios",
    "--configuration",
    "Release",
  ]);
  assert.equal(run("typo").status, 1);
  assert.equal(run("development", {}, []).status, 1);
  assert.equal(run("staging", { TEST_EXIT_CODE: "7" }).status, 7);
});
