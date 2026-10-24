# Agent instructions

## Project and scope

This repository is an Expo/React Native reference template using TypeScript, Expo Router, and pnpm. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

- These instructions apply to the whole repository.
- Before creating, moving, or changing application code, read and follow [docs/architecture/AGENTS.md](docs/architecture/AGENTS.md). Its architectural rules apply to all of `src/` by this explicit reference; its directory location alone does not give it that scope.
- Before creating, renaming, moving, or editing project files, read and follow [docs/conventions/AGENTS.md](docs/conventions/AGENTS.md). Its naming, organization and code-style conventions apply throughout the repository by this explicit reference, subject to the exceptions documented there; its directory location alone does not give it that scope.
- Read any additional `AGENTS.md` files along the path to files being changed. More specific instructions take precedence within their scope.
- Keep this file focused on repository-wide workflow, architecture rules in `docs/architecture/AGENTS.md`, and naming, organization and code-style conventions in `docs/conventions/AGENTS.md`. Reference the owning document instead of duplicating its rules.
- Preserve unrelated changes and existing behavior. The numbered modules are template placeholders; do not invent business features to populate them.

## Documentation lookup

- For library, framework, SDK, API, CLI, and cloud-service questions, fetch current documentation with Context7 rather than relying on memory. This is not required for general programming concepts, business-logic debugging, or code review without library-specific questions.
- Use `pnpm dlx ctx7@latest library <official-name> "<specific-question>"` first, then `pnpm dlx ctx7@latest docs <returned-library-id> "<specific-question>"`. Resolve first unless the user supplies a library ID. Use at most three Context7 commands per question.
- Run Context7 requests outside the default sandbox through the environment's approval mechanism. Do not send credentials or private data in documentation queries.
- On a quota error, report it and suggest `pnpm dlx ctx7@latest login` or `CONTEXT7_API_KEY`; do not silently substitute remembered API details.
- Use the Expo MCP for relevant Expo documentation and diagnostics when available. If it is unavailable, report the limitation and consult official documentation directly.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Run commands from the repository root and use pnpm, matching `pnpm-lock.yaml`. RTK is optional and is not a project dependency: use it to run shell commands when the `rtk` executable is available on `PATH`; otherwise run the commands directly. Use `rtk proxy <command>` for commands without a dedicated wrapper when RTK is available.

```bash
pnpm install                 # install existing dependencies
pnpm start                   # start the Expo dev server
pnpm lint                    # lint using the existing Biome configuration
pnpm check                   # lint, formatting and import organization
pnpm typecheck               # TypeScript, no emit
pnpm format:check            # check formatting
pnpm test                    # unit, HTTP integration and native component tests
pnpm test:watch              # watch application tests
pnpm test:coverage           # application tests with coverage reports
pnpm test:ci                 # application tests in CI with coverage
pnpm test:rename-app         # rename script integration tests (Node.js runner)
pnpm expo install <package>  # install SDK-compatible dependencies
pnpm expo install --fix      # fix incompatible versions when relevant
```

- Always use `pnpm expo install <package>` when adding dependencies so Expo can resolve SDK-compatible versions.
- Run `pnpm lint`, `pnpm check` and `pnpm typecheck` before declaring a task done. CI should run at least `pnpm check` and `pnpm typecheck`. Report failures or checks that could not run.
- Biome is already configured. Use the package scripts instead of introducing another linter with `expo lint`.
- Application tests use Jest 30 with separate Node and Expo projects. The rename-app script keeps its integration checks through Node.js's built-in test runner (`pnpm test:rename-app`). Follow the [testing guide](docs/testing.md) for environments, HTTP mocking and commands. Add meaningful tests when implementing behavior; preserve the empty business modules.
- Before writing or changing React Native Testing Library tests, read the installed version's guide at `node_modules/@testing-library/react-native/docs/guides/llm-guidelines.md`. Use its asynchronous APIs and existing matchers; keep Biome as the project's linter.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `pnpm eas-cli <command>` in pnpm projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `pnpm expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Change verification

- Keep changes limited to the requested task. Update the architecture or conventions instructions when intentionally changing the rules they own.
- Check `git diff --check` and inspect the final diff. Ensure new placeholder directories contain a `.gitkeep` so Git can preserve them.
- Summarize the changed paths, validation results, and material limitations. Create commits, builds, or deployments only when requested.
- Instruction-file format and scope reference: [AGENTS.md](https://agents.md/).
