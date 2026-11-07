import { randomUUID } from "node:crypto";
import {
  lstatSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import {
  isAppVariant,
  isAppVersion,
  VARIANTS,
  validateAppVersions,
} from "./app-versions.cjs";

const VARIANT_USAGE = `<${VARIANTS.join("|")}>`;
const HELP = `Usage: pnpm release:version ${VARIANT_USAGE} <patch|minor|major|X.Y.Z> [--dry-run]
       pnpm release:version ${VARIANT_USAGE} --build-only [--dry-run]

Updates only app-versions.json. Does not build, commit, tag or publish.`;

function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      "build-only": { type: "boolean" },
      "dry-run": { type: "boolean" },
      help: { type: "boolean" },
    },
  });
  if (values.help) {
    console.info(HELP);
    return;
  }
  const [variant, change] = positionals;
  if (
    !isAppVariant(variant) ||
    positionals.length !== (values["build-only"] ? 1 : 2)
  ) {
    throw new Error(HELP);
  }
  const filePath = resolve("app-versions.json");
  const stats = lstatSync(filePath);
  if (!stats.isFile())
    throw new Error(
      "app-versions.json must be a regular file without symlinks",
    );
  const before = readFileSync(filePath, "utf8");
  const versions = validateAppVersions(JSON.parse(before));
  const previous = versions[variant];
  let version = previous.version;
  if (!values["build-only"]) {
    const parts = version.split(".").map(Number);
    const index = ["major", "minor", "patch"].indexOf(change);
    if (index >= 0) {
      parts[index] += 1;
      for (let part = index + 1; part < parts.length; part++) parts[part] = 0;
      version = parts.join(".");
    } else if (isAppVersion(change)) {
      const nextParts = change.split(".").map(Number);
      const firstDifference = nextParts.findIndex(
        (part, index) => part !== parts[index],
      );
      if (
        firstDifference < 0 ||
        nextParts[firstDifference] < parts[firstDifference]
      ) {
        throw new Error(
          "The requested version must be greater than the current version; use --build-only for another build",
        );
      }
      version = change;
    } else {
      throw new Error(
        "Expected patch, minor, major or a version in X.Y.Z format",
      );
    }
  }
  versions[variant] = { ...previous, version, build: previous.build + 1 };
  validateAppVersions(versions);
  const newline = before.includes("\r\n") ? "\r\n" : "\n";
  const after = `${JSON.stringify(versions, null, 2).replace(/\n/g, newline)}${newline}`;
  if (!values["dry-run"]) {
    const temporary = `${filePath}.${randomUUID()}.tmp`;
    try {
      writeFileSync(temporary, after, { flag: "wx", mode: stats.mode });
      if (readFileSync(filePath, "utf8") !== before)
        throw new Error("Versions changed during release preparation");
      renameSync(temporary, filePath);
    } finally {
      rmSync(temporary, { force: true });
    }
  }
  console.info(
    `${values["dry-run"] ? "Would update" : "Updated"} ${variant}: ${previous.version} (${previous.build}) -> ${version} (${versions[variant].build})`,
  );
}

try {
  main();
} catch (error) {
  console.error(
    `release:version: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
}
