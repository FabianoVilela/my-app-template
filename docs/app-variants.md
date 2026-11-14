# App variants and local releases

Variants use Expo SDK 58 dynamic app configuration and Continuous Native
Generation (CNG). No EAS account, EAS project, OTA service or backend is required.
`app.json` owns the base production identity and shared configuration;
`app.config.ts` derives the selected variant without changing the base file.
`app-versions.json` owns each variant's app version and build counter.

| Variant | Display name suffix | Android/iOS ID suffix | URL scheme suffix |
| --- | --- | --- | --- |
| development | ` (Dev)` | `.dev` | `.dev` |
| staging | ` (Staging)` | `.staging` | `.staging` |
| production | none | none | none |

The Expo slug stays the same. Distinct native IDs allow simultaneous installation;
distinct URL schemes avoid opening the wrong installed variant. Register each
identity and callback URL with authentication, push and other services when those
capabilities are added. Backend configuration must provide actual data isolation.

## Future visual differentiation (not implemented)

Variant-specific launcher icons and an app information screen are intended future
improvements. Current variants share icon assets; their installed names already
distinguish development and staging. This proposal records direction for future
work and does not request implementation during unrelated tasks.

When implementing visual differentiation, start with these two capabilities:

- Distinct development and staging icons derived from the app's production
  identity. Combine a different color with a recognizable shape or mark so the
  distinction survives themed or tinted appearances. Preserve the production
  artwork. Choose colors and marks to fit the actual app's branding.
- An app information screen showing the selected environment and the installed
  binary's version and build. Use the per-variant versioning workflow documented here;
  avoid showing a newer config value as if it described an older installed build.

The user can supply finished assets or request AI assistance creating variants
from the production artwork. AI-generated artwork is optional and depends on the
available image tools; it is not required to use this template. Preserve editable
sources and handle platform-specific packaging separately, including the current
iOS Icon Composer asset and Android adaptive/monochrome assets. Do not assume a
generated PNG alone replaces every platform's icon resources.

Create or update the artwork once when implementing or changing the design, then
keep approved assets under `assets/` in Git. Builds should select existing assets
deterministically through `app.config.ts`; they should not invoke image generation.
After implementation, this selection is automatic for each variant. Native
regeneration and rebuilding are still required to change installed launcher icons.
Verify installed icons on Android and iOS, including themed/tinted appearances.

Additional possibilities include an in-app non-production environment indicator,
variant-specific splash details and environment/version/build metadata in error
reports. Revisit these when the corresponding capability is requested.

## Selecting configuration

Use a Node.js version allowed by `engines` in `package.json` and the package
scripts from the repository root:

```bash
pnpm start
pnpm ios
pnpm android
pnpm web
pnpm start:staging
pnpm ios:staging
pnpm android:staging
pnpm ios:production
pnpm android:production
pnpm expo:production config --json
pnpm expo:staging start --web
```

Default commands select development. Staging and production native commands select
release compilation; the environment itself does not determine debug/release.
`expo:<variant>` forwards any Expo CLI command and arguments with the same environment
selection. For example, use `pnpm expo:staging run:ios` for staging in debug mode.
The Metro command and installed development binary must use the same variant.
Release binaries include their JavaScript bundle and do not need Metro.

The runner selects `APP_VARIANT`, loads environment files with Node, and disables
Expo's automatic dotenv loading with `EXPO_NO_DOTENV=1`. It never changes `NODE_ENV`.
Configuration defaults to development outside the runner; invalid variants fail.
Direct `pnpm expo` commands bypass the runner's environment-file selection, so use
the variant commands for reproducible builds and exports.

Copy `.env.example` to `.env.development.local`, `.env.staging.local` or
`.env.production.local` and supply each environment's public values. No API URL is
required by the template. These files and `.env.<variant>` files are Git-ignored.

Precedence, highest first:

1. Existing process/CI variables.
2. `.env.<variant>.local`.
3. `.env.<variant>`.
4. Development only: `.env.local`, then `.env` (backward compatibility).

Staging and production never load generic `.env` or `.env.local` files, preventing
a development endpoint from leaking through fallback. Existing shell variables
still take precedence: inspect them when switching environments. Set the variant
through the command, not through dotenv files. `EXPO_PUBLIC_*` values are public
and are embedded into the bundle; changes require reloading/rebuilding it. Keep
credentials outside public variables. Existing startup validation still validates
URLs and locale; it does not validate CI or require a backend.

Optional Firebase services are also selected per variant, with the build-time
`FIREBASE_SERVICES`, `GOOGLE_SERVICES_JSON` and `GOOGLE_SERVICE_INFO_PLIST`
variables. Register each variant's bundle identifier and package name in its own
Firebase project; configuration rejects files registered for another variant.
Changing the selection changes native linking, so run `prebuild --clean` afterwards.
See [analytics](architecture/analytics.md#activation).

## Switching native variants

Existing native directories retain the previously generated identity. Before
switching variants or after renaming the app, regenerate and then compile:

```bash
pnpm expo:staging prebuild --clean
pnpm ios:staging
# Or: pnpm android:staging
```

`prebuild --clean` removes and regenerates native directories. Keep customizations
in app config/config plugins, as required by this repository; never rely on manual
changes inside `ios/` or `android/`. Normal repeated builds of the same unchanged
variant do not need a clean prebuild. Expo Go cannot demonstrate separate native
identities; use installed builds to verify coexistence and deep links.

`rename-app` updates the base identity in `app.json` and preserves `app.config.ts`,
including customizations. Keep names, identifiers and schemes derived from the
base configuration when customizing this file. The script does not evaluate or
validate custom overrides; hardcoded identities there will not be renamed.
Other dynamic configuration filenames are still rejected to avoid conflicting
sources of configuration.

## Versions and release preparation

A version (for example `1.3.0`) identifies an app release. A build (for example
`27`) distinguishes binaries of that release. A corrected release candidate can
remain version `1.3.0` while moving from build `27` to `28`.

`app-versions.json` is the only source for app versions and build counters. Each
variant starts at version `1.0.0`, build `1` and evolves independently. The selected
entry supplies Expo `version`, iOS `buildNumber` (string) and Android `versionCode`
(integer). `package.json.version` describes the project/template and is independent;
`app.json` does not define a second app version. Keep the versions file in Git.

```bash
pnpm release:version staging minor --dry-run
pnpm release:version staging minor        # 1.0.0 (1) -> 1.1.0 (2)
pnpm release:version staging --build-only # 1.1.0 (2) -> 1.1.0 (3)
pnpm release:version production 1.1.0     # promote the public version, with production's own next build
pnpm release:version production patch
pnpm release:version development major
```

`patch`, `minor` and `major` increment the requested version component and reset
lower components to zero. An explicit `X.Y.Z` must be greater than the variant's
current version. Use `--build-only` to retain its version. Every successful update
increments that variant's build by one, shared between iOS and Android; the build
never resets when changing version. Other variants, `app.json` and `package.json`
are preserved. `--dry-run` previews without writing. `--help` lists usage.

Versions use three nonnegative integer components without leading zeroes or
prerelease suffixes. Builds are positive integers up to Android's `2100000000`
limit. Invalid input, malformed data and overflowing increments fail before
writing. The single versions file is replaced through a temporary file; run
release preparation serially. This local workflow does not coordinate concurrent
branches/CI jobs or query store history. For an already distributed app, first
align each variant's counters with its existing uploads so the next upload uses
a new build number.

Prepare a candidate explicitly, review and commit the versions file, then
regenerate and build the chosen native variant:

```bash
pnpm release:version production --build-only
pnpm expo:production config --json
pnpm expo:production prebuild --clean
pnpm ios:production
# Or: pnpm android:production
```

Reading app configuration and running normal development commands never increment
versions. The version command does not create a commit, tag, build or deployment.
Regenerating native projects is required to carry changed version metadata into
the binary; refreshing Metro alone does not change an installed app's version.
Staging should normally test the public version intended for production, while
each app identity retains its own build counter. Check versions again after merging
release branches; increasing a build number does not imply approval for publication.

## Local production and manual publishing

Select production configuration for generation, compilation and bundling. An
installable local release is not automatically signed for store distribution.

- Android: configure release signing using your upload keystore, build a signed
  AAB with Gradle, then upload it through Google Play Console.
- iOS: on macOS with Xcode, configure your team and provisioning, archive the
  production app and distribute it to App Store Connect through Xcode. Submit it
  to TestFlight or App Review in App Store Connect.

Signing credentials and store registrations belong to each derived project and
are not provisioned by this template. Preserve
CNG by implementing persistent native signing customization through config plugins
or reproducible build tooling rather than hand-editing generated files. Keep the
variant environment active for direct native builds that invoke Expo bundling;
for example, in a shell session loaded with production public variables, export
`APP_VARIANT=production` and `EXPO_NO_DOTENV=1` before launching Gradle or Xcode from
that session. This avoids Expo loading a development `.env` during bundling.
The `ios:production` and `android:production` commands already pass the selected
environment to their child builds.

No OTA runtime is installed. Updates are delivered by submitting new app versions
to the stores. EAS Build, EAS Submit and EAS Update can each be adopted separately
later; `eas.json` is unnecessary for local variants. If adopting EAS, explicitly
map build profiles to `APP_VARIANT` and the appropriate remote environment
(`development`, `preview` for staging, `production`). Configure signing and install
`expo-dev-client` only if adopting a development-client workflow. OTA needs its
own channel/runtime-version design and is outside this template's current setup.
If adopting EAS with this versioning workflow, keep app versions sourced locally
and avoid a second automatic counter that would override the values in Git.

## Verification

Run `pnpm test:release-version`, `pnpm test:variants`, `pnpm test:rename-app`,
the application tests and the
standard lint/check/typecheck commands. Inspect each resolved configuration with
`pnpm expo:<variant> config --json`; do not share output containing private config.
On devices/simulators, verify coexistence, display names, URL schemes and the
selected backend, then launch a staging release without Metro. Automated config
tests do not establish signing, native installation or store acceptance.

References: [Expo variants](https://docs.expo.dev/build-reference/variants/),
[environment variables](https://docs.expo.dev/guides/environment-variables/),
[local production builds](https://docs.expo.dev/guides/local-app-production/),
[SDK 58 app config](https://docs.expo.dev/versions/v58.0.0/config/app/).
