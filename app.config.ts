import type { ConfigContext, ExpoConfig } from "expo/config";
import {
  isAppVariant,
  readAppVersions,
  VARIANTS,
} from "./scripts/app-versions.cjs";
import {
  assertFirebaseFilesMatch,
  FIREBASE_PACKAGES,
  readFirebaseConfig,
} from "./scripts/firebase-config.cjs";

export default function appConfig({ config }: ConfigContext): ExpoConfig {
  const variant = process.env.APP_VARIANT ?? "development";
  if (!isAppVariant(variant)) {
    throw new Error(`APP_VARIANT must be one of: ${VARIANTS.join(", ")}`);
  }

  const versions = readAppVersions();
  const { version, build } = versions[variant];

  const suffix = { development: ".dev", staging: ".staging", production: "" }[
    variant
  ];
  const label = {
    development: " (Dev)",
    staging: " (Staging)",
    production: "",
  }[variant];
  if (
    !config.name ||
    !config.slug ||
    typeof config.scheme !== "string" ||
    !config.ios?.bundleIdentifier ||
    !config.android?.package
  ) {
    throw new Error("app.json must define the base app identity");
  }

  const iosBundleIdentifier = `${config.ios.bundleIdentifier}${suffix}`;
  const androidPackage = `${config.android.package}${suffix}`;
  const firebase = readFirebaseConfig();
  assertFirebaseFilesMatch(firebase, { androidPackage, iosBundleIdentifier });
  const { analytics, crashlytics } = firebase;
  const isFirebaseEnabled = analytics || crashlytics;
  const firebasePlugins: NonNullable<ExpoConfig["plugins"]> = [];
  if (isFirebaseEnabled) {
    firebasePlugins.push(
      FIREBASE_PACKAGES.app,
      // Firebase Apple SDK 13+ is SPM-only and requires dynamic frameworks.
      ["expo-build-properties", { ios: { useFrameworks: "dynamic" } }],
    );
  }
  if (crashlytics) firebasePlugins.push(FIREBASE_PACKAGES.crashlytics);
  if (analytics) {
    firebasePlugins.push([
      FIREBASE_PACKAGES.analytics,
      { ios: { withoutAdIdSupport: true } },
    ]);
  }

  return {
    ...config,
    name: `${config.name}${label}`,
    slug: config.slug,
    version,
    extra: {
      ...config.extra,
      appVariant: variant,
      firebase: { analytics, crashlytics },
    },
    plugins: [
      ...(config.plugins ?? []),
      [
        "@sentry/react-native/expo",
        {
          organization: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          disableAutoUpload: !process.env.SENTRY_AUTH_TOKEN,
        },
      ],
      ...firebasePlugins,
    ],
    scheme: `${config.scheme}${suffix}`,
    ios: {
      ...config.ios,
      buildNumber: String(build),
      bundleIdentifier: iosBundleIdentifier,
      ...(isFirebaseEnabled ? { googleServicesFile: firebase.iosFile } : {}),
      ...(config.ios.infoPlist?.CFBundleDisplayName
        ? {
            infoPlist: {
              ...config.ios.infoPlist,
              CFBundleDisplayName: `${config.ios.infoPlist.CFBundleDisplayName}${label}`,
            },
          }
        : {}),
    },
    android: {
      ...config.android,
      versionCode: build,
      package: androidPackage,
      ...(isFirebaseEnabled
        ? { googleServicesFile: firebase.androidFile }
        : {}),
      // Analytics never reads the advertising ID; drop the SDK's merged permission.
      ...(analytics
        ? {
            blockedPermissions: [
              ...(config.android.blockedPermissions ?? []),
              "com.google.android.gms.permission.AD_ID",
            ],
          }
        : {}),
    },
  };
}
