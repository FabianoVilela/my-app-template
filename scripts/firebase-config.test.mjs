import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import appConfig from "../app.config.ts";

const require = createRequire(import.meta.url);
const {
  assertFirebaseFilesMatch,
  readFirebaseConfig,
  unlinkedFirebasePackages,
} = require("./firebase-config.cjs");

const BASE = JSON.parse(
  readFileSync(new URL("../app.json", import.meta.url)),
).expo;
const ROOT = new URL("..", import.meta.url).pathname;
const ENV_NAMES = [
  "APP_VARIANT",
  "FIREBASE_SERVICES",
  "GOOGLE_SERVICES_JSON",
  "GOOGLE_SERVICE_INFO_PLIST",
  "EXPO_PUBLIC_SENTRY_DSN",
];

/** Writes Firebase app config files registered for the given identifiers. */
function firebaseFiles(context, { androidPackage, iosBundleIdentifier }) {
  const root = mkdtempSync(join(tmpdir(), "firebase-config-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  const json = join(root, "google-services.json");
  const plist = join(root, "GoogleService-Info.plist");
  writeFileSync(
    json,
    JSON.stringify({
      client: [
        {
          client_info: {
            android_client_info: { package_name: androidPackage },
          },
        },
      ],
    }),
  );
  writeFileSync(
    plist,
    `<plist><dict><key>BUNDLE_ID</key>\n<string>${iosBundleIdentifier}</string></dict></plist>`,
  );
  return { GOOGLE_SERVICES_JSON: json, GOOGLE_SERVICE_INFO_PLIST: plist };
}

/** Applies env overrides for one test and restores the previous values. */
function useEnv(context, overrides) {
  const previous = Object.fromEntries(
    ENV_NAMES.map((name) => [name, process.env[name]]),
  );
  context.after(() => {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });
  for (const name of ENV_NAMES) delete process.env[name];
  Object.assign(process.env, overrides);
}

const STAGING = {
  androidPackage: `${BASE.android.package}.staging`,
  iosBundleIdentifier: `${BASE.ios.bundleIdentifier}.staging`,
};

test("an empty selection disables Firebase and ignores file variables", () => {
  for (const FIREBASE_SERVICES of [undefined, "", " , "]) {
    assert.deepEqual(
      readFirebaseConfig({ FIREBASE_SERVICES, GOOGLE_SERVICES_JSON: "x" }),
      { analytics: false, crashlytics: false },
    );
  }
});

test("rejects unknown services, missing files and Crashlytics with Sentry", () => {
  const files = { GOOGLE_SERVICES_JSON: "a", GOOGLE_SERVICE_INFO_PLIST: "b" };

  assert.throws(
    () => readFirebaseConfig({ ...files, FIREBASE_SERVICES: "analytics,perf" }),
    /accepts only: analytics, crashlytics/,
  );
  assert.throws(
    () => readFirebaseConfig({ FIREBASE_SERVICES: "analytics" }),
    /requires GOOGLE_SERVICES_JSON and GOOGLE_SERVICE_INFO_PLIST/,
  );
  assert.throws(
    () =>
      readFirebaseConfig({
        ...files,
        FIREBASE_SERVICES: "crashlytics",
        EXPO_PUBLIC_SENTRY_DSN: "https://key@example.test/1",
      }),
    /exclusive/,
  );
  // Analytics is independent of the crash reporter.
  assert.equal(
    readFirebaseConfig({
      ...files,
      FIREBASE_SERVICES: "analytics",
      EXPO_PUBLIC_SENTRY_DSN: "https://key@example.test/1",
    }).analytics,
    true,
  );
});

test("resolves file paths from the repository root", () => {
  const config = readFirebaseConfig({
    FIREBASE_SERVICES: " crashlytics , analytics ",
    GOOGLE_SERVICES_JSON: "firebase/google-services.json",
    GOOGLE_SERVICE_INFO_PLIST: "/abs/GoogleService-Info.plist",
  });

  assert.deepEqual(config, {
    analytics: true,
    crashlytics: true,
    androidFile: join(ROOT, "firebase/google-services.json"),
    iosFile: "/abs/GoogleService-Info.plist",
  });
});

test("rejects files registered for another variant without echoing them", (context) => {
  const services = { analytics: true, crashlytics: false };
  const production = firebaseFiles(context, {
    androidPackage: BASE.android.package,
    iosBundleIdentifier: BASE.ios.bundleIdentifier,
  });
  const files = {
    androidFile: production.GOOGLE_SERVICES_JSON,
    iosFile: production.GOOGLE_SERVICE_INFO_PLIST,
  };

  assert.throws(
    () => assertFirebaseFilesMatch({ ...services, ...files }, STAGING),
    /GOOGLE_SERVICES_JSON has no client for .*\.staging/,
  );
  assert.throws(
    () =>
      assertFirebaseFilesMatch(
        { ...services, ...files },
        { ...STAGING, androidPackage: BASE.android.package },
      ),
    /GOOGLE_SERVICE_INFO_PLIST must be registered for .*\.staging/,
  );
  assert.throws(
    () =>
      assertFirebaseFilesMatch(
        { ...services, ...files, androidFile: "/missing.json" },
        STAGING,
      ),
    /GOOGLE_SERVICES_JSON must point to a readable file/,
  );

  writeFileSync(files.androidFile, "{ not json");
  assert.throws(
    () => assertFirebaseFilesMatch({ ...services, ...files }, STAGING),
    /GOOGLE_SERVICES_JSON must be valid JSON/,
  );
});

test("unlinks every Firebase package not selected", () => {
  assert.deepEqual(
    unlinkedFirebasePackages({ analytics: false, crashlytics: false }),
    [
      "@react-native-firebase/app",
      "@react-native-firebase/analytics",
      "@react-native-firebase/crashlytics",
    ],
  );
  assert.deepEqual(
    unlinkedFirebasePackages({ analytics: true, crashlytics: false }),
    ["@react-native-firebase/crashlytics"],
  );
  assert.deepEqual(
    unlinkedFirebasePackages({ analytics: true, crashlytics: true }),
    [],
  );
});

test("app config adds Firebase only for the selected services", (context) => {
  useEnv(context, {
    APP_VARIANT: "staging",
    FIREBASE_SERVICES: "analytics,crashlytics",
    ...firebaseFiles(context, STAGING),
  });

  const config = appConfig({ config: BASE });
  const plugins = config.plugins.slice(BASE.plugins.length + 1);

  assert.deepEqual(plugins, [
    "@react-native-firebase/app",
    ["expo-build-properties", { ios: { useFrameworks: "dynamic" } }],
    "@react-native-firebase/crashlytics",
    ["@react-native-firebase/analytics", { ios: { withoutAdIdSupport: true } }],
  ]);
  assert.equal(
    config.android.googleServicesFile,
    process.env.GOOGLE_SERVICES_JSON,
  );
  assert.equal(
    config.ios.googleServicesFile,
    process.env.GOOGLE_SERVICE_INFO_PLIST,
  );
  assert.deepEqual(config.android.blockedPermissions, [
    "com.google.android.gms.permission.AD_ID",
  ]);
  assert.deepEqual(config.extra.firebase, {
    analytics: true,
    crashlytics: true,
  });
});

test("app config without Firebase keeps the native build unchanged", (context) => {
  useEnv(context, { APP_VARIANT: "staging" });

  const config = appConfig({ config: BASE });

  assert.equal(config.plugins.length, BASE.plugins.length + 1);
  assert.equal(config.ios.googleServicesFile, undefined);
  assert.equal(config.android.googleServicesFile, undefined);
  assert.equal(config.android.blockedPermissions, undefined);
  assert.deepEqual(config.extra.firebase, {
    analytics: false,
    crashlytics: false,
  });
});

test("app config rejects Firebase files from another variant", (context) => {
  useEnv(context, {
    APP_VARIANT: "production",
    FIREBASE_SERVICES: "analytics",
    ...firebaseFiles(context, STAGING),
  });

  assert.throws(() => appConfig({ config: BASE }), /GOOGLE_SERVICES_JSON/);
});

test("react-native.config.js derives autolinking from the same selection", () => {
  const read = (env) => {
    const result = spawnSync(
      process.execPath,
      [
        "-e",
        "console.log(JSON.stringify(require('./react-native.config.js')))",
      ],
      {
        cwd: ROOT,
        encoding: "utf8",
        env: {
          PATH: process.env.PATH,
          GOOGLE_SERVICES_JSON: "a",
          GOOGLE_SERVICE_INFO_PLIST: "b",
          ...env,
        },
      },
    );
    assert.equal(result.status, 0, result.stderr);
    return Object.keys(JSON.parse(result.stdout).dependencies);
  };

  assert.deepEqual(read({}), [
    "@react-native-firebase/app",
    "@react-native-firebase/analytics",
    "@react-native-firebase/crashlytics",
  ]);
  assert.deepEqual(read({ FIREBASE_SERVICES: "crashlytics" }), [
    "@react-native-firebase/analytics",
  ]);
});
