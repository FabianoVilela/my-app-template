const expoPreset = require("jest-expo/jest-preset");

/** @type {import('jest').Config} */
module.exports = {
  clearMocks: true,
  restoreMocks: true,
  passWithNoTests: false,
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.test.{ts,tsx}",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  projects: [
    {
      displayName: "node",
      testEnvironment: "node",
      testMatch: ["<rootDir>/src/**/*.test.ts"],
      transform: {
        "\\.[cm]?[jt]sx?$": expoPreset.transform["\\.[jt]sx?$"],
      },
      // Transform only ESM-only code: MSW 3 and its dependencies, and the
      // expo/virtual/env module that babel-preset-expo inlines for
      // process.env. Add a package when a Node test fails with "Must use
      // import to load ES Module".
      transformIgnorePatterns: [
        "/node_modules/(?!(\\.pnpm|expo/virtual|msw|@msw/url|@mswjs/interceptors|@open-draft/until|cookie|rettime|until-async)(/|@))",
      ],
      moduleNameMapper: {
        "^@/assets/(.*)$": "<rootDir>/assets/$1",
        "^@/(.*)$": "<rootDir>/src/$1",
      },
      setupFilesAfterEnv: ["<rootDir>/tests/jest-node.setup.ts"],
      clearMocks: true,
      restoreMocks: true,
    },
    {
      displayName: "native",
      preset: "jest-expo",
      // lucide-react-native ships only ESM (.mjs): extend jest-expo's
      // transform to .mjs and its ignore list to that package.
      transform: {
        ...expoPreset.transform,
        "\\.[cm]?[jt]sx?$": expoPreset.transform["\\.[jt]sx?$"],
      },
      transformIgnorePatterns: [
        "/node_modules/(?!(\\.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|standard-navigation|lucide-react-native))",
        "/node_modules/react-native-reanimated/plugin/",
        "/node_modules/@react-native/babel-preset/",
      ],
      // Unistyles mocks first: they stub StyleSheet.configure for the config.
      setupFiles: [
        "react-native-unistyles/mocks",
        "<rootDir>/src/bootstrap/unistyles.ts",
      ],
      testMatch: [
        "<rootDir>/src/**/*.test.tsx",
        "<rootDir>/tests/**/*.test.tsx",
      ],
      clearMocks: true,
      restoreMocks: true,
    },
  ],
};
