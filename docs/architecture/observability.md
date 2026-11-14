# Observability

The template reports errors through the vendor-independent `ErrorReporter`
contract in `infrastructure/observability/error-reporter.ts`, implemented by
`@sentry/react-native` (default) or Firebase Crashlytics (optional). It supports
exception reporting with an operation identifier and bounded technical
breadcrumbs. It deliberately does not mirror either SDK or provide tracing,
replay, remote logs, or a global service locator. Product analytics is a separate
capability; see [Analytics](analytics.md).

## Provider selection

Each build uses one crash reporter. Both SDKs install native crash handlers and a
global JavaScript error handler, so two reporters in one build would compete for
the same crashes. Selecting `crashlytics` in `FIREBASE_SERVICES` while
`EXPO_PUBLIC_SENTRY_DSN` is set fails app configuration. Bootstrap uses
Crashlytics when `env.firebase.crashlytics` is true and Sentry otherwise. Sentry's
native SDK stays linked but is never initialized when Crashlytics is selected.
Analytics is independent and works with either reporter.

## Composition and lifetime

The root layout calls `initializeObservability()` before mounting React.
Bootstrap retains one reporter for the client process, injects it into
`AppProviders`, and delegates root wrapping to the infrastructure integration.
This process lifetime is specific to the global crash SDK; other dependencies
remain explicitly assembled. The web build is a single-page app; if it later
renders HTML in Node (`static` or `server` output), initialization is skipped
there to avoid sharing request context. No configuration is required to start the template.

Startup, preference restoration and device locale refresh failures are reported
at their handling boundary. The root layout exports an Expo Router
`ErrorBoundary` that reports render errors once as `app.render` and shows the
shared error screen with retry; screen-level boundaries added later must report
only what they catch. Do not report the same error at every layer. Expected
validation failures, cancellations and normal offline behavior should not become
incidents automatically. Domain stays telemetry-free. If an application operation
needs reporting, define a pure capability beside that operation and inject it;
do not import root infrastructure into the core.

## Configuration and mobile behavior

- `EXPO_PUBLIC_SENTRY_DSN`: optional public client key, validated by `readEnv`.
  Empty disables the SDK. Debug builds never initialize or send to Sentry.
- Environment is the app variant validated by `readEnv`. Release/dist
  are detected by the SDK from installed native metadata; do not substitute
  package.json versions, which may differ from the installed binary.
- Expo Go has no native crash SDK. Native transport, caching, release metadata
  and native crashes require a rebuilt development/release binary. Web uses JS
  capture; Expo Router server-side error reporting is outside this mobile setup.
- Initialization happens when the root layout module loads. Native crashes before
  JS initialization are not covered. Earlier native initialization is a separate
  capability requiring aligned native privacy and configuration policies.
- Reporting and breadcrumb failures are swallowed so they cannot break startup
  or replace the original application failure. This is best-effort telemetry;
  the SDK owns buffering and delivery. Do not add app-level retries/queues.

## Data collection

PII collection, tracing, replay and logs are disabled. Console and HTTP breadcrumbs
are disabled; only explicit `app.operation` breadcrumbs survive JS filtering.
JS events drop user identity, request details and arbitrary extras before sending.
Use only fixed technical identifiers for operations. Never attach tokens, request
or response bodies, URLs with query parameters, personal data or user input.

This is not a universal redaction guarantee: exception messages, causes, stacks,
SDK device context and native crash reports can still contain data. Native reports
may bypass JavaScript hooks. Review Sentry server-side scrubbing and retention
before enabling a real project; keep error messages safe at their origin.
The iOS privacy manifest declares crash/diagnostic data and SDK required-reason
APIs through CNG config. Derived apps must review their complete collection policy.

## Crashlytics

Select it with `FIREBASE_SERVICES=crashlytics` plus the variant's Firebase app
config files; see [Analytics activation](analytics.md#activation) for the shared
build-time variables, file validation, conditional native linking and the dynamic
frameworks Firebase requires on iOS. The adapter in
`infrastructure/observability/crashlytics-error-reporter.ts` maps the contract
onto the modular API:

- `captureException` sets the `operation` custom key, then calls `recordError`.
  Non-`Error` values become a generic error and are never serialized. Custom keys
  are sticky in Crashlytics: the key holds the last reported operation, unlike
  Sentry's per-event tag.
- `addBreadcrumb` writes the operation to the Crashlytics log.
- User IDs and other attributes are never set. Every SDK call swallows failures.

`firebase.json` keeps Crashlytics disabled in debug builds
(`crashlytics_debug_enabled: false`), and the adapter is also a no-op under
`__DEV__`. JavaScript handler chaining is disabled
(`crashlytics_javascript_exception_handler_chaining_enabled: false`). React Native
Firebase recommends this to avoid a duplicate native crash without a JavaScript
stack. The Crashlytics config plugin adds dSYM upload on iOS and the Gradle
plugin on Android. Crashlytics does not apply JavaScript source maps: JavaScript
stacks in release builds stay minified. Prefer Sentry when readable JavaScript
stacks matter. The root component is not wrapped.

Verify with a real Firebase project: set the staging variables, run
`pnpm expo:staging prebuild --clean` and `pnpm ios:staging` or
`pnpm android:staging`, temporarily call `crash()` from
`@react-native-firebase/crashlytics`, then relaunch so the report uploads. Confirm
the variant's bundle identifier, version and symbolicated native frames in the
Firebase console, then remove the test trigger.

## Source maps and activation

This section applies to Sentry. Metro uses `getSentryExpoConfig` to generate
Debug IDs. The Expo config plugin configures native build uploads without
editing generated native projects.
Set `SENTRY_ORG`, `SENTRY_PROJECT` and build-only `SENTRY_AUTH_TOKEN` in the selected
variant environment or CI. Never put the auth token in `EXPO_PUBLIC_*`, `extra`,
plugin options, or Git. The plugin disables automatic uploads without a token,
so the unconfigured template can build. Token-bearing release builds must also
supply organization/project; upload failures should be fixed rather than ignored.

For local activation, populate the staging environment file, build with
`pnpm ios:staging` or `pnpm android:staging`, and temporarily capture a safe test
exception through the reporter. Confirm the event's environment, native version,
build and readable source-mapped stack in Sentry, then remove the test trigger.
Repeat on iOS and Android and check web independently. A passing mock test does
not prove native delivery or symbolication. This repository does not configure
EAS Update; if added, upload the matching OTA source maps and identify updates
following Sentry's Expo guide. Native build uploads do not cover later OTA bundles.

## Verification

Adapter tests cover disabled mode, per-event context, privacy hooks, unknown
exceptions, technical breadcrumbs and SDK failures for Sentry, and the matching
cases for Crashlytics. Bootstrap tests check that Crashlytics replaces Sentry
when selected, debug startup, startup failures reported once per attempt and
failed locale refreshes. Navigation tests mount the navigator without the root
layout, so they do not initialize telemetry.
Run the normal lint/check/typecheck/test scripts and variant configuration tests.
Real-device checks are required to validate native crash delivery, offline caches,
source maps and privacy manifest aggregation.

References: [Sentry Expo setup](https://docs.sentry.io/platforms/react-native/guides/expo/),
[Expo guide](https://docs.expo.dev/guides/using-sentry/),
[React Native Firebase Crashlytics](https://rnfirebase.io/crashlytics/usage).
