# Testing

The template uses Jest 30, `jest-expo` 58, React Native Testing Library 14,
`test-renderer` and MSW 3. Dependencies are development-only. No native app
configuration or business placeholders are needed to run these tests.

## Commands

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
pnpm test:ci
pnpm test:rename-app
pnpm test:variants
pnpm test:release-version
```

`test` runs once. `test:watch` watches changed tests; `test:ci` runs once with CI
behavior and coverage. Reports are written to ignored `coverage/`, including
`coverage/index.html` and `coverage/lcov.info`. Coverage includes application
source, including files without tests; no arbitrary percentage threshold is set.

CI (`.github/workflows/ci.yml`) runs `pnpm check`, `pnpm typecheck`,
`pnpm i18n:check`, `pnpm test:ci` and every script test suite. Locally, run
`pnpm test:variants` for dynamic configuration, environment isolation and
CLI forwarding checks. Run `pnpm test:release-version` for independent version
selection, version/build increments, previews, rejected requests and unchanged
files on failure. The script tests use Node's built-in runner and are excluded from Jest.

To select an environment or an individual suite:

```bash
pnpm test --selectProjects node
pnpm test --selectProjects native
pnpm test --runTestsByPath src/infrastructure/http/axios-http-client.test.ts
```

## Environments and placement

`jest.config.cjs` defines two projects:

| Project | Files | Environment and purpose |
| --- | --- | --- |
| `node` | `src/**/*.test.ts` | Node for pure domain/application behavior and infrastructure adapters |
| `native` | `src/**/*.test.tsx`, `tests/**/*.test.tsx` | `jest-expo` for components, React hooks and Router integration |

Colocate tests with the code they exercise, in the same architectural layer.
Use `.test.tsx` for React hook tests even if they contain no JSX. Never put tests
or fixtures in `src/app/`, where Expo Router treats files as routes. Cross-route
tests and reusable testing setup belong in root `tests/`.

The native project loads `react-native-unistyles/mocks` and then
`bootstrap/unistyles.ts`; mocked styles always resolve with the light theme and
zero runtime values, so do not assert computed theme styles in unit tests.

Both projects clear mock call history and restore spies between tests. They
resolve the existing `@/` and `@/assets/` aliases. Node tests use the Expo Babel
transform without loading native setup. Only the ESM-only dependencies listed in
its `transformIgnorePatterns` (MSW 3 and its dependencies, plus Expo's inlined
environment module) are transformed for Jest's CommonJS runtime; add a package
there when a Node test reports "Must use import to load ES Module". Tests in Node must not import native
UI modules; use the native project when an integration requires React Native.

## Environment validation

`src/infrastructure/env/read-env.test.ts` runs in Node and exercises the real
Zod schemas through the public reader/parser: optional API configuration,
HTTP/HTTPS development hosts, invalid URLs, locale fallback, app variants and
sanitized errors. The i18n adapter tests check that the injected default locale
preserves device and saved-preference precedence. See [validation](architecture/validation.md).

## Domain and application

Test pure rules directly. Supply small typed fakes for application ports rather
than importing concrete HTTP/storage adapters or mounting React. Keep test cases
focused on observable outcomes and error handling. Do not create sample business
features to fill the numbered template modules.

## HTTP integration

The Node setup starts the shared `httpServer` from `tests/http-server.ts` before
each suite, resets runtime handlers after each test, and closes interception
after the suite. Unhandled requests fail instead of reaching real services.
Do not create an additional server in each test file.

Register handlers for the requests needed by a test:

```ts
import { http, HttpResponse } from "msw/http";

httpServer.use(
  http.get("https://api.example.test/items", () =>
    HttpResponse.json({ items: [] }),
  ),
);
```

Import the shared `httpServer` using a relative path from the test file. These
test-only helpers must never be imported by production code. MSW runs in Node;
no service worker, native MSW package, development startup hook or live backend
is required. MSW 3 imports HTTP utilities from `msw/http`, delay from
`msw/utils/delay`, and configures unhandled traffic with `onUnhandledFrame`.

`axios-http-client.test.ts` exercises query/header/body transmission, JSON
decoding, empty responses, HEAD, HTTP errors, malformed JSON, network failures,
timeouts and cancellation without mocking Axios itself. New module services can
reuse this setup while application operations continue to use injected fakes.

## Date adapter

`dayjs-date-adapter.test.ts` exercises the real adapter through the pure
`DateAdapter` contract. It checks strict parsing, project formats, leap years,
calendar arithmetic, precision, invalid inputs, UTC serialization and immutability
in local and UTC modes. No Day.js mocks or native setup are needed. See the
[date adapter guide](architecture/date-adapter.md) for its behavioral contract.

Use separate processes to verify local behavior across time zones, including
daylight saving transitions:

```bash
TZ=UTC pnpm test --runTestsByPath src/infrastructure/date/dayjs-date-adapter.test.ts
TZ=America/New_York pnpm test --runTestsByPath src/infrastructure/date/dayjs-date-adapter.test.ts
```

Consumer tests should inject `DateAdapter` fakes instead of importing Day.js.
Keep any clock dependency separate and explicit; the adapter does not read now.

## Storage adapters

The storage suites run in the native project as `.test.tsx` files because the
libraries import native modules. MMKV uses its own in-memory test implementation;
the suite stubs Nitro's bootstrap so no native object can be created. It checks
string persistence behavior and normalized failures. The library mock does not
simulate reopening a file or sharing persistence across instances with the same ID.

SecureStore uses Expo's native mocks and scoped public API spies. Tests verify
missing and empty values, asynchronous calls, service/accessibility options,
unsupported environments, invalid keys and failure propagation. Consumer tests
should inject typed `LocalStorage` or `SecureStorage` fakes rather than importing
either vendor. Domain/application tests should use their own application ports.

See the [storage guide](architecture/storage.md) for the contract and composition.
Disk durability, Keychain/Keystore protection and reinstall/backup behavior need
real iOS and Android development builds. Browser persistence needs browser checks.
Jest mocks do not establish those guarantees.

## Components and navigation

Read the installed Testing Library documentation before changing tests:
`node_modules/@testing-library/react-native/docs/guides/llm-guidelines.md`.
Await `render`, `renderHook`, user events and Router operations. Prefer accessible
queries and built-in matchers such as `toBeDisabled` and `toBeOnTheScreen`.
Prefer `userEvent` for supported interactions; avoid snapshots of entire screens.

Use `expo-router/testing-library` for navigation integration. The existing
`tests/navigation.test.tsx` mounts the actual home route under
`bootstrap/app-navigation.tsx` through `renderRouter` and verifies its URL and
content. Routes in `src/app/` export only what Expo Router reads, so tests import
the navigator from bootstrap rather than from the root layout. Supply application operations through their
usual props/providers when testing components; MSW is initialized only in the
Node project. The native suite exercises JavaScript behavior with native mocks,
not actual device rendering, permissions or keyboard behavior.

`test-renderer` is the peer dependency of Testing Library 14. It is distinct from
the deprecated `react-test-renderer`; no additional matcher library is needed.

## Device journeys

Maestro is the recommended next step once the app has meaningful user journeys.
Its CLI and emulator/simulator setup are separate from pnpm dependencies. Keep
future journeys in `.maestro/` and test an installed app build, with deterministic
backend data. No Maestro flows or device tests are configured yet.

## References

- [Expo unit testing and SDK 58 migration](https://docs.expo.dev/develop/unit-testing/)
- [Expo Router testing](https://docs.expo.dev/router/reference/testing/)
- [Testing Library quick start](https://oss.callstack.com/react-native-testing-library/docs/start/quick-start)
- [MSW Node integration](https://mswjs.io/guides/integrations/node)

## Internationalization

`infrastructure/i18n/i18next-adapter.test.ts` exercises isolated real translation instances with fake storage/device locales: locale resolution, preferences, storage failures and plurals. `shared/i18n/app-translation-provider.test.tsx` covers the shared facade hooks, rich text and locale-aware formatting through a real adapter. `catalogs.test.ts` validates logical messages, interpolation variables, markup and plural categories, and checks catalog directories and `app.json` supportedLocales against `APP_LOCALES`. Navigation integration checks language changes without losing the route. Type assertions in the facade suite check the public translation contract during `pnpm typecheck`. Run `pnpm i18n:types` after catalog edits and `pnpm i18n:check` in CI; pre-push includes the freshness check. See the [i18n guide](architecture/i18n.md) for native and web limitations.

## Bootstrap

`bootstrap/startup.test.tsx` runs startup with the real translation adapter and a
fake preference store: foreground locale refresh, refresh failures reported at
their boundary, `dispose` and invalid configuration. `app-providers.test.tsx`
replaces startup to cover the splash screen, the error screen and retry, and
disposal of a session that resolves after unmounting.

## Observability

Sentry adapter and bootstrap tests mock the SDK to verify disabled reporting, context isolation, filtering and failure containment without network traffic. Real release builds are needed for native delivery and source-map verification. See [observability](architecture/observability.md).
