const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

/** @typedef {(typeof VARIANTS)[number]} AppVariant */
/** @typedef {{ version: string, build: number }} AppVersion */
/** @typedef {Record<AppVariant, AppVersion>} AppVersions */

/** Single source of the supported variants for config and scripts. */
const VARIANTS = /** @type {const} */ ([
  "development",
  "staging",
  "production",
]);
const MAX_BUILD = 2100000000;

/** @param {unknown} value @returns {value is AppVariant} */
function isAppVariant(value) {
  return (
    typeof value === "string" && VARIANTS.some((variant) => variant === value)
  );
}

/** @param {unknown} value @returns {value is string} */
function isAppVersion(value) {
  return (
    typeof value === "string" &&
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value) &&
    value.split(".").every((part) => Number.isSafeInteger(Number(part)))
  );
}

/** @param {unknown} input @returns {AppVersions} */
function validateAppVersions(input) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("app-versions.json must contain an object");
  }
  for (const variant of VARIANTS) {
    const entry = Reflect.get(input, variant);
    if (!entry || !isAppVersion(entry.version)) {
      throw new Error(
        `${variant}.version must use major.minor.patch without prerelease suffixes`,
      );
    }
    if (
      !Number.isSafeInteger(entry.build) ||
      entry.build < 1 ||
      entry.build > MAX_BUILD
    ) {
      throw new Error(
        `${variant}.build must be an integer between 1 and ${MAX_BUILD}`,
      );
    }
  }
  return /** @type {AppVersions} */ (input);
}

function readAppVersions(
  filePath = resolve(__dirname, "../app-versions.json"),
) {
  return validateAppVersions(JSON.parse(readFileSync(filePath, "utf8")));
}

module.exports = {
  VARIANTS,
  isAppVariant,
  isAppVersion,
  readAppVersions,
  validateAppVersions,
};
