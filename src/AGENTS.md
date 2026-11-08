# Application architecture

These rules apply throughout `src/` and own layer responsibilities, dependency direction and module boundaries. [Project conventions](../docs/conventions/AGENTS.md) own names, imports, route notation, platform suffixes and test filenames.

Organize business capabilities in modules with inward-pointing dependencies. The numbered modules are empty reference placeholders; create only abstractions with a current responsibility.

## Source structure

```text
src/
├── app/                # Expo Router routes and layouts
├── bootstrap/          # Dependency composition, providers and startup
├── modules/module-1/   # Representative; module-2/3 have the same shape
│   ├── domain/
│   ├── application/ports/
│   ├── infrastructure/
│   └── presentation/   # screens/, components/, hooks/ as needed
├── infrastructure/     # date, env, http, i18n, storage, observability
└── shared/             # i18n (pure contracts, injected facade), ui, lib
```

- Preserve the skeleton; do not fill it with dummy features or empty entry points. In derived products, name modules after business capabilities and create only the directories currently needed.
- Business modules are not Expo native modules; they require no native-module discovery or native-project configuration.

## Responsibilities and allowed dependencies

These rules cover source imports, including type imports. Runtime calls to an injected adapter do not authorize importing its concrete implementation into the core. Biome enforces them per layer; see [layer import boundaries](../docs/conventions/biome.md#layer-import-boundaries) for coverage and limits.

| Location | Put here | Allowed dependencies |
| --- | --- | --- |
| `app/` | Thin routes, route parameter handling, navigation layouts and route configuration | Module presentation entry points, `bootstrap`, shared UI, Expo Router and UI frameworks |
| `bootstrap/` | Manual dependency assembly, startup coordination and provider composition | Application contracts and operations, concrete adapters, module presentation providers, shared infrastructure and required framework APIs |
| `modules/<name>/domain/` | Business concepts, invariants, policies, entities and value objects when needed | Its own domain and framework-independent `shared/lib` |
| `modules/<name>/application/` | Application operations and orchestration, input/output contracts and ports | Its own domain, application contracts and pure shared utilities |
| `modules/<name>/infrastructure/` | Module-specific HTTP/storage adapters, external DTOs, mappings and technical error translation | Its own application ports and domain, shared infrastructure, relevant external SDKs |
| `modules/<name>/presentation/` | Screens, components, React hooks, visual state, formatting and navigation reactions | Its own application API and domain types, shared UI/utilities, React Native and UI libraries |
| `infrastructure/` | Technical HTTP, storage and observability mechanisms reused across modules | External libraries and pure shared utilities; no business-module internals |
| `shared/ui/` | Reusable UI primitives and theme resources without module-specific business knowledge | React, React Native, UI libraries and pure shared utilities |
| `shared/lib/` | Small pure utilities independent of business contexts and frameworks | Other pure shared utilities and platform-independent language APIs |

## Shared internationalization boundary

- `app`, `bootstrap`, module presentation and `shared/ui` may consume the public `shared/i18n` facade. Core layers stay translation-free; presentation maps outcomes to messages. Vendor imports, catalogs, device detection and language persistence stay in root `infrastructure/i18n`.
- `shared/i18n/contracts.ts` and generated `app-messages.ts` are pure. The React facade receives its implementation through provider props and never imports infrastructure or bootstrap; bootstrap constructs the implementation and mounts the provider.
- **Isolated exceptions:** root `infrastructure/i18n/` may import those two pure files directly, and `infrastructure/env/` may import `APP_LOCALES` from `contracts.ts`. No infrastructure may import the shared barrel or React facade. See [Internationalization](../docs/architecture/i18n.md).

## Domain and application boundaries

- Keep domain and application independent of React, React Native, Expo, routing, HTTP clients, device storage and state/cache libraries.
- Prefer types and functions; add classes or richer models only to protect invariants or clarify behavior. Domain owns business rules, application owns workflows, presentation owns UI state, messages and navigation.
- Define capability-named ports beside the policy that needs them, usually in `application/ports/`; domain-owned contracts may live in domain.
- Inject external capabilities through parameters or factories. No concrete adapters, global service locators or React contexts in the core. Avoid pass-through layers, generic repositories and duplicate models without a responsibility.
- Model only client-required business knowledge; server authorization and authoritative consistency checks remain necessary.

## Adapters and composition

- Module-specific endpoints, external payloads, persistence details and conversions stay in that module's infrastructure.
- Translate external formats and errors at the adapter boundary when needed. Core contracts must not expose vendor-specific response or error types.
- Share technical mechanisms in root infrastructure only when actually reused; business-specific adapters stay with their module.
- Place a shared, vendor-independent contract by who consumes it. If domain or application may depend on it, keep it pure in `shared/lib/` with adapters in root infrastructure (`DateAdapter`). If only infrastructure, bootstrap and presentation consume it, keep it beside its adapters in root `infrastructure/` (`HttpClient`, `LocalStorage`, `SecureStorage`, `ErrorReporter`). A core operation needing one of these defines its own port, and an outer layer adapts the shared contract to it.

## Technical capabilities

Keep each vendor import inside its concrete adapter, and vendor types out of public contracts. Read the guide before changing a capability.

| Capability | Contract | Rules that always apply | Guide |
| --- | --- | --- | --- |
| HTTP | `HttpClient` in `infrastructure/http/` (Axios) | Module services receive HTTP explicitly and own endpoint validation and error policy; no status-to-`null`, retries, refresh or UI reactions in the transport | [HTTP](../docs/architecture/http-client.md) |
| Validation | Zod directly in infrastructure `*.schema.ts`; no generic adapter | Validate requests before HTTP and responses before mapping; strict requests and tolerant responses unless endpoint policy overrides; no Zod, DTOs or validation errors in the core; no schemas in the transport | [Validation](../docs/architecture/validation.md) |
| Environment | `infrastructure/env/read-env.ts`, static Expo dot notation | Bootstrap validates before initialization and injects the locale; never expose values or payloads in errors | [Environment](../docs/architecture/validation.md#environment) |
| Dates | `DateAdapter` in `shared/lib/date-adapter.ts` (dayjs in `infrastructure/date/`) | Exchange and persist instants in UTC; display in the device zone unless business rules differ; preserve calendar-only values and IANA zones of location-bound schedules | [Dates](../docs/architecture/date-adapter.md) |
| Storage | `LocalStorage`, `SecureStorage` in `infrastructure/storage/` (MMKV, SecureStore) | Credentials use SecureStore, preferences use MMKV; neither is a database; consumers own serialization, keys and migrations; adapters do not discard failed writes | [Storage](../docs/architecture/storage.md) |
| Error reporting | `ErrorReporter` in `infrastructure/observability/` (Sentry) | Domain stays telemetry-free; report once at the handling boundary with fixed technical context; no payloads, credentials or personal data | [Observability](../docs/architecture/observability.md) |

## Bootstrap: composition and startup

- Bootstrap selects concrete adapters, injects operations and mounts providers through manual factories. Create composition/startup files only when needed; never export eager default instances or a global service locator.
- Root `index.ts` imports `expo-router/entry`, then `bootstrap/unistyles.ts`, which registers themes and breakpoints before any route creates styles. Keep that file limited to style configuration.
- `bootstrap/startup.ts` prepares what the first screen needs and returns the dependencies with a `dispose`; `app-providers.tsx` runs it per mounted application, holds the splash screen until it settles and shows the shared error screen with retry on failure. Startup invokes module operations for business workflows; SDK initialization stays in infrastructure.
- Modules, shared code and infrastructure must not import bootstrap. Routes mount composed providers and delegate substantial assembly to bootstrap.
- Give resources explicit app/session/feature lifetimes; preserve instances across renders and release them at lifecycle end.
- Prepare only what the initial UI requires, and define failure and retry behavior for required asynchronous startup.

## Module boundaries and shared code

- Use business capabilities as module boundaries; screens and actions usually belong inside an existing module. See [Adding a business module](../docs/architecture/add-module.md).
- Keep a module's implementation private. Add explicit public entry points only when it has real consumers; do not create empty `index.ts` files.
- Other modules must not reach into private screens, hooks, adapters or repositories.
- Public APIs preserve layer rules: a core consumer must not import a barrel that re-exports React UI or concrete infrastructure.
- Avoid cyclic module dependencies. Coordinate cross-module workflows in an explicit outer boundary, through contracts.
- Within a module, import the defining files with relative paths rather than its own barrel or `@/modules/<name>/...` aliases.
- Move code to `shared/` only when its meaning and reasons to change match across consumers. Keep context-specific models separate; no universal shared domain model by default.

## Presentation, routing and mobile behavior

- Use Expo Router. Keep non-route files outside `src/app/`; routes adapt navigation input to module screens, `_layout.tsx` files configure navigators, and neither implements business rules.
- Keep UI state close to its consumers; treat remote-data caching separately from business rules.
- Hooks may connect application operations to React and manage request/UI lifecycle; business decisions belong in domain or application.
- Use platform-specific files where the platform requires different behavior; do not spread device checks into the core.
- Web is a single-page app (`web.output: "single"`) with no API routes or server rendering. Switching to `static` or `server` is an explicit decision: configure Unistyles server rendering and keep process-wide SDKs and per-request state out of render paths.
- Add offline queues, persistence and synchronization only when required, documenting consistency, retry and conflict behavior first.

## Verification when implementing behavior

- Lint enforces layer imports written as package names and `@/` aliases; it does not establish relative-path escapes, public entry point purity or semantic correctness.
- Exercise domain and application through injected fakes, without React or live services. Test adapter translations and important journeys in proportion to the change.
- Do not add a test framework, dependency or enforcement tool solely to populate this skeleton.
