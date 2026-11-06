import type { ConfigContext, ExpoConfig } from "expo/config";
import { isAppVariant, readAppVersions } from "./scripts/app-versions.cjs";

export default function appConfig({ config }: ConfigContext): ExpoConfig {
  const variant = process.env.APP_VARIANT ?? "development";
  if (!isAppVariant(variant)) {
    throw new Error("APP_VARIANT must be development, staging or production");
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

  return {
    ...config,
    name: `${config.name}${label}`,
    slug: config.slug,
    version,
    scheme: `${config.scheme}${suffix}`,
    ios: {
      ...config.ios,
      buildNumber: String(build),
      bundleIdentifier: `${config.ios.bundleIdentifier}${suffix}`,
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
      package: `${config.android.package}${suffix}`,
    },
  };
}
