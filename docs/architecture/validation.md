# Validation and environment configuration

The template uses Zod 4 directly, without a generic validation adapter. Zod is a
runtime dependency installed through `pnpm expo install zod@latest`. TypeScript
strict mode is enabled. The standard package is the default; consider `zod/mini`
only after measuring bundle constraints on the target platforms.

## Environment

`src/infrastructure/env/env.schema.ts` defines public configuration validation.
`read-env.ts` exposes `readEnv()` for Expo and `parseEnv(input: unknown)` for
explicit inputs and tests. Both return validated configuration with `apiUrl` and
`defaultLocale`. No configuration is read or parsed at import time.

`readEnv()` constructs its input from static `process.env.EXPO_PUBLIC_*`
references, which Expo replaces in the JavaScript bundle. Dynamic property
access, destructuring `process.env`, or parsing the entire `process.env` object
does not provide equivalent client-side behavior. These variables are public;
do not use them for secrets. Expo already loads `.env` files; no additional dotenv
or native configuration package is required.

`EXPO_PUBLIC_API_URL` is optional; an empty string becomes absent. A supplied URL
must use HTTP or HTTPS. Localhost, emulator IPs and LAN hosts remain valid for
development. Bootstrap validates supplied configuration before creating startup
dependencies. When a real API client is composed, require `apiUrl` there, after
checking for an injected HTTP override. The template starts without an API URL
and does not create a default HTTP client yet.

`EXPO_PUBLIC_DEFAULT_LOCALE` accepts `en` and `pt-BR`; absent, empty or unsupported
values fall back to `en`, preserving existing behavior. Bootstrap supplies this
value to the translation adapter; the adapter no longer reads environment values.

Invalid configuration throws an ordinary error with field names and issue codes,
without raw values or a Zod error cause. Startup uses the existing bilingual retry
control on failure. Configuration errors require correcting configuration and
reloading/rebuilding the bundle; retry alone cannot change embedded values.
This validates runtime startup configuration, not the build environment in CI.

## Backend boundaries

Keep request and response schemas in separate `*.schema.ts` files in the owning
module's infrastructure. Services validate requests before sending and validate
responses before converting DTOs into application models. Use parsed output,
not the original unchecked value. Zod types and errors stay inside infrastructure.
Do not add schemas to the shared HTTP transport or import them into the core.

The [HTTP guide](http-client.md#example-product-service) contains complete examples
for a derived product. The numbered template modules intentionally remain empty.
Client validation complements server validation and authorization; it does not
replace them.

## Verification

`read-env.test.ts` checks optional/empty URLs, supported HTTP hosts, invalid URL
protocols, locale defaults, explicit environment reads and sanitized failures.
Native i18n tests verify injected locale behavior. Future service tests should
verify invalid requests never call HTTP, parsed payloads are transmitted, malformed
responses become application-owned failures, extra response fields are tolerated,
and endpoint-specific empty responses are handled. Use the existing Node HTTP
test setup; do not add dummy endpoints just to test the validation library.

Run `pnpm lint`, `pnpm check`, `pnpm typecheck` and `pnpm test`. Smoke-test startup
on iOS, Android and web with valid and invalid configuration when those runtimes
are available; Jest does not establish Metro inlining or device behavior.

References: [Zod](https://zod.dev/), [schema API](https://zod.dev/api),
[Expo environment variables](https://docs.expo.dev/guides/environment-variables/).
