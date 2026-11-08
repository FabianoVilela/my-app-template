# my-app-template

A reference template for Expo and React Native apps developed with AI coding
agents. It provides a layered architecture, vendor-independent adapters,
enforced conventions and agent instructions, so derived apps start from
consistent patterns instead of improvised ones. Everything in the template is
meant to be copied; it contains no business features.

## What is included

- Expo SDK 58, React Native, React Compiler, Expo Router with typed routes and
  TypeScript in strict mode.
- A [layered architecture](src/AGENTS.md) with business modules,
  whose import boundaries are enforced by Biome.
- Adapters behind application-owned contracts: an [HTTP client](docs/architecture/http-client.md)
  (Axios), [local and secure storage](docs/architecture/storage.md) (MMKV and
  SecureStore), [dates](docs/architecture/date-adapter.md) (Day.js) and
  [error reporting](docs/architecture/observability.md) (Sentry, optional).
- Typed [internationalization](docs/architecture/i18n.md) in English and
  Brazilian Portuguese, and [validated public configuration](docs/architecture/validation.md)
  with Zod.
- [App variants](docs/app-variants.md) (development, staging, production) with
  independent identities, versions and build numbers.
- [Tests](docs/testing.md) with Jest, Testing Library and MSW; Biome, Git hooks,
  Conventional Commits and GitHub Actions CI.

- [Styling](docs/conventions/AGENTS.md#typescript-components-and-styles) with
  Unistyles v3: light and dark theme tokens that follow the OS appearance, and
  breakpoints.

Not included yet: state management, authentication, end-to-end tests and EAS
Build or Update.

## Requirements

- Node.js in the range declared by `engines` in `package.json`, and pnpm at the
  version in `packageManager`.
- Xcode with an iOS simulator, or Android Studio with an emulator, to build and
  run the app locally.

## Get started

```bash
pnpm install
```

```bash
pnpm ios     # or: pnpm android
```

This compiles a local debug build, installs it on an [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/), [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/) or device and starts Metro. Use the same command to start later sessions; it rebuilds native code incrementally.

> [!IMPORTANT]
> Expo Go is not supported. The app imports native modules that Expo Go does not include, such as MMKV through Nitro Modules, so it fails at launch there with a NitroModules error. `expo-dev-client` is not installed, so `pnpm start` runs in Expo Go mode: do not open the app through its QR code or its `i`/`a` shortcuts.

## New app checklist

Work through these steps when starting a product from the template:

1. **Rename the app with your own identifiers.** Without explicit options, the
   script keeps the template's `com.fabianovilela` namespace and changes only the
   last segment. Preview first, then apply:

   ```bash
   pnpm rename-app "My App" --ios-bundle-id com.example.myapp --android-package com.example.myapp --dry-run
   ```

   ```bash
   pnpm rename-app "My App" --ios-bundle-id com.example.myapp --android-package com.example.myapp
   ```

   See [renaming in detail](#renaming-in-detail) for the generated values and limits.
2. **Replace the icons and splash screen.** Update `assets/expo.icon` (iOS),
   the Android adaptive and monochrome images and `icon.png` in `assets/images/`,
   `favicon.png`, `splash-icon.png` and the splash `backgroundColor` in `app.json`.
   See [visual differentiation](docs/app-variants.md#future-visual-differentiation-not-implemented)
   for per-variant icons.
3. **Configure the environment.** Copy `.env.example` to
   `.env.development.local` (and the staging or production equivalent) and set
   the values you need. `EXPO_PUBLIC_` values are embedded in the app and public.
   See [selecting configuration](docs/app-variants.md#selecting-configuration).
4. **Decide on error reporting.** Set `EXPO_PUBLIC_SENTRY_DSN` and the build-only
   Sentry variables to activate it, or leave them empty to keep it disabled. See
   [observability](docs/architecture/observability.md#source-maps-and-activation).
5. **Review locales and privacy.** Adjust the default locale and catalogs in the
   [i18n guide](docs/architecture/i18n.md), and keep the iOS privacy manifest in
   `app.json` accurate when you add SDKs that collect data.
6. **Replace the placeholder modules.** Rename `src/modules/module-1` after your
   first business capability, follow [adding a business module](docs/architecture/add-module.md),
   and delete the unused `module-2` and `module-3`. Replace the home screen text
   in `src/app/index.tsx`.
7. **Regenerate and rebuild.** If `ios/` or `android/` exist, run
   `pnpm expo:development prebuild --clean`, then `pnpm ios` or `pnpm android`.
8. **Run the [quality checks](#quality-checks)** and commit.

## Documentation

| Topic | Document |
| --- | --- |
| Instructions for AI agents (start here) | [AGENTS.md](AGENTS.md) |
| Layers, dependencies and module boundaries | [Application architecture](src/AGENTS.md) |
| Naming, organization, style and commits | [Project conventions](docs/conventions/AGENTS.md) |
| Adding a feature end to end | [Adding a business module](docs/architecture/add-module.md) |
| HTTP services and dependency composition | [HTTP client](docs/architecture/http-client.md) |
| Schemas and public configuration | [Validation](docs/architecture/validation.md) |
| Preferences and credentials | [Storage](docs/architecture/storage.md) |
| Dates, UTC and time zones | [Date operations](docs/architecture/date-adapter.md) |
| Translations and localized formatting | [Internationalization](docs/architecture/i18n.md) |
| Error and crash reporting | [Observability](docs/architecture/observability.md) |
| Variants, versions and local releases | [App variants](docs/app-variants.md) |
| Test environments and patterns | [Testing](docs/testing.md) |
| Lint rules and overrides | [Biome guide](docs/conventions/biome.md) |
| Hooks, staging and troubleshooting | [Git workflow](docs/git-workflow.md) |

## Renaming in detail

Use a Node.js version allowed by `engines` in `package.json` and run from the repository root:

```bash
pnpm rename-app "Minha Aplicação" --dry-run
pnpm rename-app "Minha Aplicação"
```

With npm, use `--` immediately after the script name to forward all arguments:

```bash
npm run rename-app -- "My App" --dry-run
npm run rename-app -- "My App" \
  --ios-bundle-id com.myapp \
  --android-package com.myapp \
  --dry-run
```

Remove `--dry-run` to apply the previewed changes. Without the `--` separator,
npm consumes options such as `--dry-run` and may pass identifier values as extra
positional arguments. The script detects its options in npm configuration and
stops before reading or writing project files, with the corrected command syntax.
It does not infer missing options from npm configuration. If the same error
persists with `--`, remove the corresponding `npm_config_*` environment variables
or npm configuration settings. See [npm run-script argument forwarding](https://docs.npmjs.com/cli/v11/commands/npm-run-script).

The script updates `app.json`, `package.json` and matching complete names in text
files, including source, documentation, `.env.example`, `.github` and `.vscode`.
It reports the affected files. It leaves JSON property names, dependency lockfiles,
private environment files, assets, symlinks, native projects, dependencies, build
output and other hidden directories untouched. It does not rename directories or
files. Review the preview when the old name is also a common word in the project.

| Setting | Generated value for `Minha Aplicação` |
| --- | --- |
| Expo display name | `Minha Aplicação` |
| Expo slug and npm package basename | `minha-aplicacao` |
| Deep-link scheme | `minhaaplicacao` |
| iOS bundle identifier | `com.fabianovilela.minhaaplicacao` |
| Android application ID | `com.fabianovilela.minhaaplicacao` |

Display names support Unicode letters and numbers, spaces, and `. _ & ( ) + ! -`.
This script uses a conservative subset of display-name characters so textual
references remain safe in source files. Slugs follow the template's lowercase
ASCII kebab-case convention, with a maximum of 100 characters. Accents are removed
when deriving the slug. For names that cannot produce an ASCII slug, supply
`--slug`. Existing npm scopes and each platform's identifier namespace are
preserved; only the last identifier segment is changed. Numeric names and Java
reserved words receive an `app` prefix in schemes and native identifier segments.

Use explicit options when needed:

```bash
pnpm rename-app "Minha Aplicação" \
  --slug minha-aplicacao \
  --scheme minhaaplicacao \
  --ios-bundle-id br.com.example.minhaaplicacao \
  --android-package br.com.example.minhaaplicacao
```

Schemes start with a lowercase letter and contain lowercase letters, digits,
`+`, `.` or `-`. iOS identifiers use reverse-domain notation with ASCII letters,
digits, hyphens and periods. Android IDs have at least two segments, each starting
with a lowercase letter and containing ASCII letters, digits or underscores.
`--help` lists all options. Invalid arguments, malformed or missing configuration,
and unsupported dynamic `app.config.*` overrides stop the operation before writing.
`app.config.ts` is preserved, including customizations. Keep variant identities
derived from `app.json`; custom hardcoded overrides are not renamed or validated. Writes are staged beside the originals; if a write fails, the script attempts to restore
every file already committed and reports any restoration failures.

This template uses [Expo app configuration](https://docs.expo.dev/versions/v58.0.0/config/app/)
and [Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/).
Expo Router handles the [React Native root registration](https://reactnative.dev/docs/appregistry);
keep `main: "expo-router/entry"`. Native projects are generated from `app.json`
and `app.config.ts`. Keep native customization in app config and config plugins.
If `ios/` or `android/` already exists, regenerate with
`pnpm expo:development prebuild --clean`, and rebuild. A new native build is required
for the updated native name, identifiers and scheme to take effect.

Changing an application ID creates a separate store identity. For an existing
published app, pass its current IDs explicitly to preserve them. Remote build
projects, store records, signing credentials, Firebase/OAuth registrations and
remote service configuration are not renamed by this local script. Update those
services separately if their names or registered identifiers need to change.

Run the script's integration checks with the built-in Node.js test runner:

```bash
pnpm test:rename-app
```

## App variants

The template supports `development` (default), `staging` and `production` through
Expo dynamic configuration. EAS and OTA are optional and are not configured.
See [App variants and local releases](docs/app-variants.md) for environment files,
local builds, switching variants and manual store submission.

```bash
pnpm ios                         # development, debug build
pnpm android:staging              # staging, release build
pnpm ios:production               # production, release build
pnpm expo:staging config --json   # inspect the resolved configuration
pnpm test:variants
```

Each variant has an independent version and build counter in `app-versions.json`.
Prepare releases explicitly; these commands do not build or publish:

```bash
pnpm release:version staging minor --dry-run
pnpm release:version staging minor
pnpm release:version staging --build-only
pnpm release:version production 1.1.0
```

`patch`, `minor`, `major` or a higher explicit version also increment the build.
`--build-only` increments the build without changing the version. The package's
own version remains independent. Regenerate native projects after version changes.
See the [versioning workflow](docs/app-variants.md#versions-and-release-preparation).

When switching an existing native project to another variant, first regenerate it
with the matching `pnpm expo:<variant> prebuild --clean` command.

## Quality checks

```bash
pnpm check
pnpm typecheck
pnpm i18n:check
pnpm test:ci
pnpm test:variants
pnpm test:release-version
pnpm test:rename-app
```

Run these before merging changes. `check` verifies lint, formatting and import
organization; `lint` is available for lint-only checks. Biome keeps defaults
explicit and checks import cycles (including type-only cycles), filename casing
and named exports with route exceptions, and enforces layer and module import
boundaries; relative paths that leave a module still require review. See the
[project conventions](docs/conventions/AGENTS.md) and
[Biome guide](docs/conventions/biome.md) for coverage, exceptions and examples.

## Local Git hooks

`pnpm install` installs Husky hooks automatically through `prepare`. In an
existing checkout, run `pnpm prepare` to reinstall them.

- Before a commit, lint-staged checks staged files with Biome without rewriting them.
- Commit messages must follow Conventional Commits, for example
  `chore(tooling): configure local git hooks`.
- Before a push, catalog freshness, TypeScript and application tests must pass.
  Rename script tests run separately with `pnpm test:rename-app`.

See the [Git workflow guide](docs/git-workflow.md) for commands, partial staging
and troubleshooting. These hooks are local; GitHub Actions CI
(`.github/workflows/ci.yml`) repeats the checks on pushes to `main` and pull
requests. Deployment and remote merge policies are not configured. Commitizen
is not required.
