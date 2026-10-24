# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **example** directory and create a blank **src/app** directory where you can start developing.

### Other setup steps

- Biome is already configured for linting, formatting and import organization. See the quality checks below.
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Rename the app

Use Node.js 22.13 or newer and run from the repository root:

```bash
rtk pnpm rename-app "Minha Aplicação" --dry-run
rtk pnpm rename-app "Minha Aplicação"
```

With npm, use `--` immediately after the script name to forward all arguments:

```bash
rtk proxy npm run rename-app -- "My App" --dry-run
rtk proxy npm run rename-app -- "My App" \
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
rtk pnpm rename-app "Minha Aplicação" \
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
and dynamic `app.config.*` overrides stop the operation before writing. Writes
are staged beside the originals; if a write fails, the script attempts to restore
every file already committed and reports any restoration failures.

This template uses [Expo app configuration](https://docs.expo.dev/versions/v58.0.0/config/app/)
and [Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/).
Expo Router handles the [React Native root registration](https://reactnative.dev/docs/appregistry);
keep `main: "expo-router/entry"`. Native projects are generated from `app.json`.
If `ios/` or `android/` already exists, preserve manual native changes, regenerate
with `rtk pnpm expo prebuild --clean`, and rebuild. A new native build is required
for the updated native name, identifiers and scheme to take effect.

Changing an application ID creates a separate store identity. For an existing
published app, pass its current IDs explicitly to preserve them. Linked EAS
projects, store records, signing credentials, Firebase/OAuth registrations and
remote service configuration are not renamed by this local script. Update those
services separately if their names or registered identifiers need to change.

Run the script's integration checks with the built-in Node.js test runner:

```bash
rtk pnpm test:rename-app
```

## Project architecture

- [Application architecture](docs/architecture/AGENTS.md)
- [Project conventions](docs/conventions/AGENTS.md)
- [HTTP client, module services and dependency composition](docs/architecture/http-client.md)

The JSON HTTP client is ready to use through an Axios adapter. API configuration
is optional until a derived project connects a backend; see `.env.example` and
the HTTP guide. The template does not create business services or contact an API
at startup.

## Quality checks

```bash
rtk pnpm check
rtk pnpm typecheck
```

Run both before merging changes. `check` verifies lint, formatting and import
organization; `lint` is available for lint-only checks. Biome keeps defaults
explicit and checks import cycles (including type-only cycles), filename casing
and named exports with route exceptions. Layer and module import boundaries
still require review. See the [project conventions](docs/conventions/AGENTS.md)
and [Biome override guide](docs/conventions/biome.md) for coverage, exceptions and
examples.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
