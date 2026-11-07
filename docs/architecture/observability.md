# Observability

The template uses `@sentry/react-native` behind the vendor-independent
`ErrorReporter` contract in `infrastructure/observability/error-reporter.ts`.
It supports exception reporting with an operation identifier and bounded technical
breadcrumbs. It deliberately does not mirror the Sentry SDK or provide analytics,
tracing, replay, remote logs, or a global service locator.

## Composition and lifetime

The root layout calls `initializeObservability()` before mounting React.
Bootstrap retains one reporter for the client process, injects it into
`AppProviders`, and delegates root wrapping to the infrastructure integration.
This process lifetime is specific to the global crash SDK; other dependencies
remain explicitly assembled. The web build is a single-page app; if it later
renders HTML in Node (`static` or `server` output), initialization is skipped
there to avoid sharing request context. No configuration is required to start the template.

Startup, preference restoration and device locale refresh failures are reported
at their handling boundary. Do not report the same error at every layer. Expected
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

## Source maps and activation

Metro uses `getSentryExpoConfig` to generate Debug IDs. The Expo config plugin
configures native build uploads without editing generated native projects.
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
exceptions, technical breadcrumbs and SDK failures. Bootstrap tests check debug
startup, startup failures reported once per attempt and failed locale refreshes;
navigation tests mount the navigator without the root layout, so they do
not initialize telemetry.
Run the normal lint/check/typecheck/test scripts and variant configuration tests.
Real-device checks are required to validate native crash delivery, offline caches,
source maps and privacy manifest aggregation.

References: [Sentry Expo setup](https://docs.sentry.io/platforms/react-native/guides/expo/),
[Expo guide](https://docs.expo.dev/guides/using-sentry/).
