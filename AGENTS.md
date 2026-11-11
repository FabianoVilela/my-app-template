# Agent instructions

Expo/React Native reference template using TypeScript, Expo Router and pnpm. Prioritize mobile-first patterns, performance and cross-platform compatibility. Preserve unrelated changes and existing behavior. The numbered modules are placeholders; do not invent business features to populate them.

## Instruction scope

- [`src/AGENTS.md`](src/AGENTS.md) owns architecture and applies to application changes under `src/`.
- [Project conventions](docs/conventions/AGENTS.md) own naming, organization and style, and apply when creating, renaming, moving or editing project files.
- Read any `AGENTS.md` along the path to changed files; the more specific one takes precedence. Reference the owning document instead of duplicating its rules.

## Context by task

Read applicable instructions once per task. Start with the affected code and tests; consult a guide only when the change involves that capability. Avoid bulk-reading unrelated documentation, catalogs, generated files or lockfiles.

| Task | Additional reference |
| --- | --- |
| New business module or feature | [Adding a business module](docs/architecture/add-module.md) |
| Theme tokens, shared UI components, fonts or icons | [Design system](docs/architecture/design-system.md) |
| HTTP endpoints or services | [HTTP client](docs/architecture/http-client.md) and [validation](docs/architecture/validation.md) |
| Public environment configuration | [Validation](docs/architecture/validation.md#environment) |
| App variants, launcher icons, versions or release preparation | [App variants](docs/app-variants.md) |
| Dates, UTC or time zones | [Date operations](docs/architecture/date-adapter.md) |
| Translations, locale or localized formatting | [Internationalization](docs/architecture/i18n.md) |
| Preferences or credentials | [Storage](docs/architecture/storage.md) |
| Error reporting or crash SDK | [Observability](docs/architecture/observability.md) |
| Adding or changing tests | [Testing](docs/testing.md) |
| Biome configuration or diagnostics | [Biome guide](docs/conventions/biome.md) |
| Git hooks or commit troubleshooting | [Git workflow](docs/git-workflow.md) |

Instruction files own rules; guides own details and examples. `docs/archive/` is background only.

## Documentation lookup

- For library, framework, SDK, API, CLI and cloud-service questions, fetch current documentation rather than relying on memory. Not required for general concepts, business-logic debugging or code review without library-specific questions.
- Use the Context7 MCP when available; otherwise `pnpm dlx ctx7@0.10.0 library <name> "<question>"`, then `pnpm dlx ctx7@0.10.0 docs <library-id> "<question>"`. Resolve first unless given a library ID. Use at most three lookups per question and no credentials or private data in queries.
- On a quota error, report it and suggest `pnpm dlx ctx7@0.10.0 login` or `CONTEXT7_API_KEY`; do not silently substitute remembered API details.
- Before changing Expo or React Native APIs, read the `expo` major version in `package.json` and consult `https://docs.expo.dev/versions/v<major>.0.0/`, or [Expo's documentation index](https://docs.expo.dev/llms.txt) for other topics. Use the Expo MCP when available; if not, report it and consult the official documentation. Reuse documentation already fetched for the same task.

## Commands

Run from the repository root with pnpm. RTK is optional and not a project dependency: use it for shell commands when `rtk` is on `PATH`.

```bash
pnpm verify                  # Biome, i18n catalogs, types and application tests
pnpm test --runTestsByPath <file>  # focused test while iterating
pnpm check:fix               # apply Biome fixes; review the result
pnpm test:rename-app         # when changing the rename script
pnpm test:variants           # when changing app configuration or variants
pnpm test:release-version    # when changing release preparation
pnpm expo install <package>  # always use this to add dependencies
```

- Run `pnpm verify` before declaring a task done, and report failures or checks that could not run. CI (`.github/workflows/ci.yml`) also runs the script suites and `pnpm expo install --check`; keep it in sync when adding a required check.
- Biome is already configured; do not introduce `expo lint` or another linter.
- Add meaningful tests when implementing behavior.

## Git

Hooks check staged files, commit messages and `pnpm check:push`. Fix failures and retry. Do not bypass them with `--no-verify`, `HUSKY=0` or equivalents unless the user explicitly asks. See the [Git workflow](docs/git-workflow.md) and [commit conventions](docs/conventions/AGENTS.md#commit-messages).

## Rules

- `ios/` and `android/` are generated and Git-ignored (Continuous Native Generation). Configure native behavior in `app.json`, `app.config.ts` and config plugins; never create or edit generated native files by hand.
- Expo Go is not supported: the app imports native modules it does not bundle, such as MMKV, and fails at launch. Run and verify in a local debug build with `pnpm ios` or `pnpm android`, which also rebuild after native changes. `expo-dev-client` is not installed, so `pnpm start` runs in Expo Go mode; do not open the app through its QR code or `i`/`a` shortcuts. Do not suggest Expo Go or add fallbacks for it.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies.

## Change verification

- Keep changes limited to the requested task. Update `src/AGENTS.md` or the conventions when intentionally changing the rules they own.
- Write documentation in English, in standard Markdown with relative links for repository documents.
- Check `git diff --check` and inspect the final diff.
- Summarize changed paths, validation results and material limitations. Create commits, builds or deployments only when requested.
