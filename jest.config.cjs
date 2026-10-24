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
      // MSW 3 and its dependencies ship ESM. Babel converts them for Jest.
      transformIgnorePatterns: [],
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
      testMatch: [
        "<rootDir>/src/**/*.test.tsx",
        "<rootDir>/tests/**/*.test.tsx",
      ],
      clearMocks: true,
      restoreMocks: true,
    },
  ],
};
