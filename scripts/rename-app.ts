/// <reference types="node" />

import { randomUUID } from "node:crypto";
import {
  lstat,
  readdir,
  readFile,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { parseArgs } from "node:util";

type JsonObject = Record<string, unknown>;
type Change = {
  path: string;
  before: string;
  after: string;
  mode: number;
};

const CLI_OPTIONS = {
  "dry-run": { type: "boolean" },
  slug: { type: "string" },
  scheme: { type: "string" },
  "ios-bundle-id": { type: "string" },
  "android-package": { type: "string" },
  help: { type: "boolean" },
} as const;

const HELP = `Usage: pnpm rename-app "App Name" [options]
       npm run rename-app -- "App Name" [options]

  --dry-run                 Preview without writing files
  --slug <slug>             Lowercase kebab-case slug and npm package name
  --scheme <scheme>         Deep-link scheme (default: compact slug)
  --ios-bundle-id <id>      Override the iOS reverse-domain identifier
  --android-package <id>    Override the Android reverse-domain identifier
  --help                    Show this help

Run from the project root. Requires Node.js >= 22.13.
With npm, put -- after rename-app so options reach this script.
Native identifiers keep their current namespace unless explicitly overridden.`;

const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  "ios",
  "android",
  "assets",
  "dist",
  "build",
  "coverage",
  "web-build",
]);
const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".jsonc",
  ".md",
  ".mdx",
  ".yaml",
  ".yml",
  ".html",
  ".css",
  ".txt",
  ".toml",
]);
const IGNORED_FILES = new Set([
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
  "bun.lock",
  "skills-lock.json",
  "rename-app.ts",
  "rename-app.test.ts",
]);
const RESERVED_SEGMENTS = new Set(
  `abstract assert boolean break byte case catch char class const continue default
   do double else enum extends final finally float for goto if implements import
   instanceof int interface long native new null package private protected public
   return short static strictfp super switch synchronized this throw throws
   transient true false try void volatile while _`.split(/\s+/),
);

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function assertForwardedOptions() {
  // npm consumes flags before its -- separator and exports them as config.
  // Refuse to write when the original options can no longer be reconstructed.
  const consumed = Object.entries(CLI_OPTIONS).filter(([option, config]) => {
    const key = `npm_config_${option.replace(/-/g, "_")}`;
    const value = process.env[key] ?? process.env[key.toUpperCase()];
    return (
      value !== undefined && (config.type === "string" || value !== "false")
    );
  });
  if (consumed.length > 0) {
    const flags = consumed.map(([option]) => `--${option}`).join(", ");
    throw new Error(
      `Options were received as npm configuration instead of script arguments: ${flags}.\n` +
        'Use the -- separator: npm run rename-app -- "App Name" [options].\n' +
        "No files were changed. If this persists, remove the corresponding npm_config_* environment variables or npm configuration settings.",
    );
  }
}

function object(value: unknown, label: string): JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return value as JsonObject;
}

function text(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value;
}

function parseJson(content: string, path: string): JsonObject {
  try {
    return object(JSON.parse(content), path);
  } catch (error) {
    throw new Error(`Invalid JSON in ${path}: ${errorMessage(error)}`);
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

function validate(value: string, pattern: RegExp, label: string): string {
  if (!pattern.test(value)) {
    throw new Error(`Invalid ${label}: ${JSON.stringify(value)}.`);
  }
  return value;
}

function identifier(
  current: unknown,
  override: string | undefined,
  suffix: string,
  label: string,
  pattern: RegExp,
): string {
  if (override !== undefined) {
    return validate(override, pattern, label);
  }
  const previous = validate(text(current, label), pattern, label);
  return `${previous.slice(0, previous.lastIndexOf("."))}.${suffix}`;
}

function createReplacer(
  pairs: [string, string][],
  oldScheme: string,
  scheme: string,
) {
  // When old display name and slug coincide, use the slug in general references.
  // The actual display-name fields are assigned explicitly below.
  const replacements = new Map(pairs);
  const alternatives = [...replacements.keys()]
    .sort((left, right) => right.length - left.length)
    .map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const escapedScheme = oldScheme.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}_-])(?:(${escapedScheme})(?=:)|${alternatives.join("|")})(?![\\p{L}\\p{N}_-])`,
    "gu",
  );
  return (value: string) =>
    value.replace(pattern, (match, schemeMatch: string | undefined) =>
      schemeMatch ? scheme : (replacements.get(match) ?? match),
    );
}

function replaceJsonStrings(
  content: string,
  replace: (value: string) => string,
) {
  // Work on decoded values to preserve escaping and leave JSON property names alone.
  return content.replace(/"(?:[^"\\]|\\.)*"(\s*:)?/g, (token, colon) => {
    if (colon) return token;
    const value: unknown = JSON.parse(token);
    if (typeof value !== "string") return token;
    const updated = replace(value);
    return updated === value ? token : JSON.stringify(updated);
  });
}

async function collectFiles(directory: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const isIncludedDotfile = [".github", ".vscode", ".env.example"].includes(
      entry.name,
    );
    if (
      (entry.name.startsWith(".") && !isIncludedDotfile) ||
      IGNORED_FILES.has(entry.name)
    )
      continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory() && !IGNORED_DIRECTORIES.has(entry.name)) {
      files.push(...(await collectFiles(path)));
    } else if (
      entry.isFile() &&
      (TEXT_EXTENSIONS.has(extname(entry.name)) ||
        entry.name === ".env.example")
    ) {
      files.push(path);
    }
  }
  return files.sort();
}

async function readChange(path: string): Promise<Change> {
  const stats = await lstat(path);
  if (!stats.isFile()) {
    throw new Error(`Expected a regular file, without symlinks: ${path}`);
  }
  const before = await readFile(path, "utf8");
  if (before.includes("\0") || before.includes("\uFFFD")) {
    throw new Error(`Expected UTF-8 text: ${path}`);
  }
  return { path, before, after: before, mode: stats.mode };
}

function serialize(value: JsonObject, original: string): string {
  const newline = original.includes("\r\n") ? "\r\n" : "\n";
  return `${JSON.stringify(value, null, 2).replace(/\n/g, newline)}${newline}`;
}

async function writeChanges(changes: Change[]) {
  const staged = new Map<Change, string>();
  const committed: Change[] = [];
  try {
    for (const change of changes) {
      if ((await readFile(change.path, "utf8")) !== change.before) {
        throw new Error(`File changed during rename: ${change.path}`);
      }
      const temporary = `${change.path}.${randomUUID()}.rename-tmp`;
      staged.set(change, temporary);
      await writeFile(temporary, change.after, {
        flag: "wx",
        mode: change.mode,
      });
    }
    for (const [change, temporary] of staged) {
      if ((await readFile(change.path, "utf8")) !== change.before) {
        throw new Error(`File changed during rename: ${change.path}`);
      }
      await rename(temporary, change.path);
      committed.push(change);
    }
  } catch (error) {
    const failures: string[] = [];
    for (const change of committed.reverse()) {
      try {
        await writeFile(change.path, change.before);
      } catch (rollbackError) {
        failures.push(`${change.path}: ${errorMessage(rollbackError)}`);
      }
    }
    const detail = failures.length
      ? ` Could not restore: ${failures.join("; ")}`
      : " Original files restored.";
    throw new Error(`Rename failed: ${errorMessage(error)}${detail}`);
  } finally {
    for (const temporary of staged.values()) {
      try {
        if (await exists(temporary)) await unlink(temporary);
      } catch (error) {
        console.warn(`Could not remove ${temporary}: ${errorMessage(error)}`);
      }
    }
  }
}

async function main() {
  assertForwardedOptions();
  const args = process.argv.slice(2);
  if (args[0] === "--") args.shift();
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: CLI_OPTIONS,
  });
  if (values.help) {
    console.info(HELP);
    return;
  }
  if (positionals.length !== 1) {
    throw new Error(`Pass exactly one app name in quotes.\n${HELP}`);
  }
  const name = validate(
    positionals[0].trim().normalize("NFC"),
    /^[\p{L}\p{N}][\p{L}\p{M}\p{N} ._&()+!-]*$/u,
    "display name (use letters, numbers, spaces, or . _ & ( ) + ! -)",
  );
  const derivedSlug = name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const slug = validate(
    values.slug ?? derivedSlug,
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "slug (use --slug with lowercase ASCII kebab-case)",
  );
  if (slug.length > 100 || ["node_modules", "favicon.ico"].includes(slug)) {
    throw new Error(
      "The slug must be at most 100 characters and npm-compatible.",
    );
  }
  const compact = slug.replace(/-/g, "");
  // Prefix numeric names and Java reserved words with an alphabetic segment.
  const suffix =
    /^[a-z]/.test(compact) && !RESERVED_SEGMENTS.has(compact)
      ? compact
      : `app${compact}`;
  const scheme = validate(
    values.scheme ?? suffix,
    /^[a-z][a-z0-9+.-]*$/,
    "scheme (start with a lowercase letter; use lowercase letters, digits, + . -)",
  );
  const root = process.cwd();
  for (const extension of ["js", "ts", "cjs", "mjs", "cts", "mts", "json"]) {
    if (await exists(join(root, `app.config.${extension}`))) {
      throw new Error(
        `app.config.${extension} can override app.json. Migrate its configuration to app.json before using this script.`,
      );
    }
  }
  const app = await readChange(join(root, "app.json"));
  const pkg = await readChange(join(root, "package.json"));
  const appConfig = parseJson(app.before, app.path);
  const expo = object(appConfig.expo ?? appConfig, "Expo config");
  const packageConfig = parseJson(pkg.before, pkg.path);
  const ios = object(expo.ios, "expo.ios");
  const android = object(expo.android, "expo.android");
  const oldName = text(expo.name, "expo.name");
  const oldSlug = text(expo.slug, "expo.slug");
  const oldScheme = text(
    expo.scheme,
    "expo.scheme (a single scheme is required)",
  );
  const oldPackageName = text(packageConfig.name, "package.json name");
  const scope = oldPackageName.startsWith("@")
    ? oldPackageName.slice(0, oldPackageName.indexOf("/") + 1)
    : "";
  const packageName = `${scope}${slug}`;
  if (packageName.length > 214) {
    throw new Error("The scoped npm package name exceeds 214 characters.");
  }
  const oldIosId = text(ios.bundleIdentifier, "expo.ios.bundleIdentifier");
  const oldAndroidId = text(android.package, "expo.android.package");
  const iosId = identifier(
    oldIosId,
    values["ios-bundle-id"],
    suffix,
    "iOS bundle identifier",
    /^[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/,
  );
  const androidId = identifier(
    oldAndroidId,
    values["android-package"],
    suffix,
    "Android package",
    /^[a-z][a-zA-Z0-9_]*(?:\.[a-z][a-zA-Z0-9_]*)+$/,
  );
  const replace = createReplacer(
    [
      [oldName, name],
      [oldScheme, scheme],
      [oldSlug, slug],
      [oldPackageName, packageName],
      [oldIosId, iosId],
      [oldAndroidId, androidId],
    ],
    oldScheme,
    scheme,
  );
  const updatedApp = parseJson(
    replaceJsonStrings(app.before, replace),
    app.path,
  );
  const updatedExpo = object(updatedApp.expo ?? updatedApp, "Expo config");
  updatedExpo.name = name;
  updatedExpo.slug = slug;
  updatedExpo.scheme = scheme;
  object(updatedExpo.ios, "expo.ios").bundleIdentifier = iosId;
  object(updatedExpo.android, "expo.android").package = androidId;
  if (ios.infoPlist !== undefined) {
    const previousInfo = object(ios.infoPlist, "expo.ios.infoPlist");
    const updatedInfo = object(
      object(updatedExpo.ios, "expo.ios").infoPlist,
      "expo.ios.infoPlist",
    );
    for (const field of ["CFBundleDisplayName", "CFBundleName"]) {
      if (previousInfo[field] === oldName) updatedInfo[field] = name;
    }
    if (previousInfo.CFBundleIdentifier === oldIosId) {
      updatedInfo.CFBundleIdentifier = iosId;
    }
  }
  app.after = serialize(updatedApp, app.before);
  const updatedPackage = parseJson(
    replaceJsonStrings(pkg.before, replace),
    pkg.path,
  );
  updatedPackage.name = packageName;
  pkg.after = serialize(updatedPackage, pkg.before);

  const changes = [app, pkg];
  for (const path of await collectFiles(root)) {
    if (path === app.path || path === pkg.path) continue;
    const change = await readChange(path);
    change.after =
      extname(path) === ".json"
        ? replaceJsonStrings(change.before, replace)
        : replace(change.before);
    changes.push(change);
  }
  const pending = changes.filter((change) => change.before !== change.after);
  console.info(
    JSON.stringify({ name, slug, scheme, iosId, androidId }, null, 2),
  );
  for (const change of pending)
    console.info(`  ${relative(root, change.path)}`);
  if (!values["dry-run"]) await writeChanges(pending);
  console.info(
    `${values["dry-run"] ? "Would update" : "Updated"} ${pending.length} file(s).`,
  );
  if (
    (await exists(join(root, "ios"))) ||
    (await exists(join(root, "android")))
  ) {
    console.warn(
      "Native directories exist. After applying, regenerate them with pnpm expo prebuild --clean and rebuild. This deletes generated native customizations; preserve any manual changes first.",
    );
  }
  if (pending.length > 0) {
    console.info(
      "Rebuild the app to apply its native name, identifiers and scheme.",
    );
  }
}

main().catch((error: unknown) => {
  console.error(`rename-app: ${errorMessage(error)}`);
  process.exitCode = 1;
});
