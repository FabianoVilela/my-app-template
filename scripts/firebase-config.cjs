const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

/** @typedef {(typeof FIREBASE_SERVICES)[number]} FirebaseService */
/**
 * @typedef {{ analytics: boolean, crashlytics: boolean }} FirebaseServices
 * @typedef {FirebaseServices & { androidFile?: string, iosFile?: string }} FirebaseConfig
 */

const FIREBASE_SERVICES = /** @type {const} */ (["analytics", "crashlytics"]);

/** Native packages per service; the app package is linked when any is enabled. */
const FIREBASE_PACKAGES = {
  app: "@react-native-firebase/app",
  analytics: "@react-native-firebase/analytics",
  crashlytics: "@react-native-firebase/crashlytics",
};

const PROJECT_ROOT = resolve(__dirname, "..");

/** @param {unknown} value @returns {value is FirebaseService} */
function isFirebaseService(value) {
  return FIREBASE_SERVICES.some((service) => service === value);
}

/**
 * Reads the build-time Firebase selection. Native linking, config plugins and
 * runtime flags all derive from this result, so they cannot disagree.
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {FirebaseConfig}
 */
function readFirebaseConfig(env = process.env) {
  const names = (env.FIREBASE_SERVICES ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  for (const name of names) {
    if (!isFirebaseService(name)) {
      throw new Error(
        `FIREBASE_SERVICES accepts only: ${FIREBASE_SERVICES.join(", ")}`,
      );
    }
  }

  const analytics = names.includes("analytics");
  const crashlytics = names.includes("crashlytics");

  if (!analytics && !crashlytics) return { analytics, crashlytics };

  // Two crash SDKs compete for native signal handlers and the JS global handler.
  if (crashlytics && env.EXPO_PUBLIC_SENTRY_DSN?.trim()) {
    throw new Error(
      "Crashlytics and Sentry are exclusive: clear EXPO_PUBLIC_SENTRY_DSN or remove crashlytics from FIREBASE_SERVICES",
    );
  }

  if (!env.GOOGLE_SERVICES_JSON || !env.GOOGLE_SERVICE_INFO_PLIST) {
    throw new Error(
      "FIREBASE_SERVICES requires GOOGLE_SERVICES_JSON and GOOGLE_SERVICE_INFO_PLIST",
    );
  }

  return {
    analytics,
    crashlytics,
    androidFile: resolve(PROJECT_ROOT, env.GOOGLE_SERVICES_JSON),
    iosFile: resolve(PROJECT_ROOT, env.GOOGLE_SERVICE_INFO_PLIST),
  };
}

/** @param {string} file @param {string} name */
function readConfigFile(file, name) {
  try {
    return readFileSync(file, "utf8");
  } catch {
    throw new Error(`${name} must point to a readable file`);
  }
}

/**
 * Rejects Firebase files registered for another app variant. Errors name the
 * variable, never the file contents.
 * @param {FirebaseConfig} config
 * @param {{ androidPackage: string, iosBundleIdentifier: string }} identity
 */
function assertFirebaseFilesMatch(config, identity) {
  if (!config.androidFile || !config.iosFile) return;

  let packages = [];
  try {
    const json = JSON.parse(
      readConfigFile(config.androidFile, "GOOGLE_SERVICES_JSON"),
    );
    packages = (json.client ?? []).map(
      (client) => client?.client_info?.android_client_info?.package_name,
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("GOOGLE_SERVICES_JSON must be valid JSON");
    }
    throw error;
  }

  if (!packages.includes(identity.androidPackage)) {
    throw new Error(
      `GOOGLE_SERVICES_JSON has no client for ${identity.androidPackage}`,
    );
  }

  const plist = readConfigFile(config.iosFile, "GOOGLE_SERVICE_INFO_PLIST");
  const bundleId = /<key>BUNDLE_ID<\/key>\s*<string>([^<]*)<\/string>/.exec(
    plist,
  )?.[1];

  if (bundleId !== identity.iosBundleIdentifier) {
    throw new Error(
      `GOOGLE_SERVICE_INFO_PLIST must be registered for ${identity.iosBundleIdentifier}`,
    );
  }
}

/**
 * Packages to keep out of native autolinking for this build.
 * @param {FirebaseServices} services
 */
function unlinkedFirebasePackages(services) {
  const enabled = services.analytics || services.crashlytics;

  return [
    ...(enabled ? [] : [FIREBASE_PACKAGES.app]),
    ...(services.analytics ? [] : [FIREBASE_PACKAGES.analytics]),
    ...(services.crashlytics ? [] : [FIREBASE_PACKAGES.crashlytics]),
  ];
}

module.exports = {
  FIREBASE_PACKAGES,
  FIREBASE_SERVICES,
  assertFirebaseFilesMatch,
  readFirebaseConfig,
  unlinkedFirebasePackages,
};
