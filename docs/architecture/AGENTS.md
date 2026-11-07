# Application architecture instructions

## Scope and intent

The root [AGENTS.md](../../AGENTS.md) explicitly applies these instructions to application code throughout `src/`.

For file and directory names, identifier style, imports and exports, route notation, platform suffixes and test filenames, follow [Project conventions](../conventions/AGENTS.md). This document owns layer responsibilities, dependency direction and module boundaries.

Organize business capabilities in modules with inward-pointing dependencies. The numbered modules are empty reference placeholders; create only abstractions with a current responsibility.

## Source structure

```text
src/
├── app/                          # Expo Router routes and layouts
├── bootstrap/                    # Dependency composition, providers and startup
├── modules/
│   └── module-1/                 # Representative; module-2/3 have the same shape
│       ├── domain/
│       ├── application/ports/
│       ├── infrastructure/
│       └── presentation/         # screens/, components/, hooks/ as needed
├── infrastructure/
│   ├── date/
│   ├── env/
│   ├── http/
│   ├── i18n/
│   ├── storage/
│   └── observability/
└── shared/
    ├── i18n/                    # Pure i18n contracts and injected React facade
    ├── ui/
    └── lib/
```

- Preserve the template skeleton; do not fill it with dummy features or empty entry points. In derived products, name modules after business capabilities and create only the directories currently needed.
- Business modules are not Expo native modules; they require no native-module discovery or native-project configuration.

## Responsibilities and allowed dependencies

The following rules concern source imports, including type imports. Runtime calls to an injected adapter do not authorize importing its concrete implementation into the application core. Biome enforces them per layer; see [layer import boundaries](../conventions/biome.md#layer-import-boundaries) for coverage and limits.

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

- `app`, `bootstrap`, module presentation and `shared/ui` may consume the public `shared/i18n` facade. Core layers remain translation-free; presentation maps outcomes to messages. Keep vendor imports, catalogs, device detection and language persistence in root `infrastructure/i18n`.
- `shared/i18n/contracts.ts` and generated `app-messages.ts` are pure: no React, native, vendor or initialization dependencies. The shared React facade receives its implementation through provider props and never imports infrastructure or bootstrap.
- **Isolated exceptions:** root `infrastructure/i18n/` may import directly from those two pure files (types and the `APP_LOCALES` registry), and `infrastructure/env/` may import `APP_LOCALES` from `contracts.ts` to validate the default locale. No infrastructure may import the shared barrel or React facade; the exceptions do not extend to other infrastructure directories.
- Bootstrap constructs the implementation and mounts the provider. See [Internationalization](i18n.md) for rendering injection, lifecycle, catalog maintenance and platform details.

## Domain and application boundaries

- Keep domain and application independent of React, React Native, Expo, routing, HTTP clients, device storage and state/cache libraries.
- Prefer types and functions; introduce classes or richer models only to protect invariants or clarify behavior. Domain owns business rules, application owns workflows, and presentation owns UI state, messages and navigation.
- Define capability-named ports as interfaces or function types beside the policy that needs them, usually in `application/ports/`. Domain-owned contracts may live in domain.
- Inject external capabilities through parameters or factories. No concrete adapters, global service locators or React contexts in the core. Avoid pass-through layers, generic repositories and duplicate models without a responsibility.
- Model only client-required business knowledge; server authorization and authoritative consistency checks remain necessary.

## Adapters and composition

- Put module-specific endpoints, external payloads, persistence details and data conversions inside that module's infrastructure.
- Translate external formats and errors at the adapter boundary when needed; follow the [project naming conventions](../conventions/AGENTS.md#identifiers) for external DTO fields and application-owned models. Core contracts must not expose vendor-specific response or error types.
- Share technical mechanisms in root infrastructure only when they are actually reused. Keep business-specific adapters with their module.
- Place a shared, vendor-independent contract by who may consume it. If domain or application code may depend on it directly, keep it pure and put it in `shared/lib/`, with its adapters in root infrastructure (`DateAdapter`). If only infrastructure, bootstrap and presentation consume it, keep it beside its adapters in root `infrastructure/` (`HttpClient`, `LocalStorage`, `SecureStorage`, `ErrorReporter`). A core operation that needs one of these capabilities defines its own port in `application/ports/`, and an outer layer adapts the shared contract to it.

## HTTP integrations

- Use `HttpClient` from `infrastructure/http/`; keep Axios imports inside its concrete adapter and public types vendor-independent.
- Module infrastructure services receive HTTP explicitly and implement application-owned capabilities without HTTP imports in the core. Keep endpoint validation and error policy there; avoid pass-through wrappers.
- Keep global status-to-`null` conversion, retries, refresh and UI reactions out of the transport. See the [HTTP guide](http-client.md) for contract details and composition examples.

## Validation and environment configuration

- Use Zod directly in infrastructure-owned `*.schema.ts` files; no generic validation adapter. Keep Zod, DTOs and validation errors out of domain/application; map validated data to core contracts.
- Validate requests before HTTP and responses before mapping. Default to strict request objects and tolerant response objects; endpoint policy may override this. Schemas stay outside shared transport.
- Read public configuration through `infrastructure/env/read-env.ts` with static Expo dot notation. Bootstrap validates before initialization and injects the locale. API URL remains optional until a real client needs it; missing/unsupported locale falls back to English. Never expose configuration values or payloads in validation errors.
- See [Validation](validation.md) for schema placement, configuration behavior and service examples.

## Date operations

- Use the library-independent `DateAdapter` contract in `shared/lib/date-adapter.ts`. Keep `dayjs` and plugin imports inside the concrete adapter in `infrastructure/date/`; do not expose library instances, types, tokens or errors through the contract.
- Exchange and persist instants in UTC. Display in the device's current time zone by default, subject to explicit business rules; interpret input in the zone defined by its context. Calendar-only dates preserve their calendar value. Location-bound schedules preserve their IANA zone and local-time intent; recurrence declares its time-zone policy. See the [date/time policy](date-adapter.md#utc-and-device-display) for representations, conversion boundaries and adapter limits.
- Inject the pure contract into consumers; select implementations in bootstrap. See the [date guide](date-adapter.md) for parsing, arithmetic and adapter modes.

## Local persistence

- Use `LocalStorage`/`SecureStorage` from `infrastructure/storage/`; keep MMKV/SecureStore vendor imports in their adapters. Preferences and serialized state use MMKV; tokens and credentials use SecureStore. Neither is a local database.
- Core operations depend on application ports, never device storage. Consuming infrastructure owns serialization, validation, keys, migrations and defaults; shared adapters persist strings and normalize failures without discarding failed writes.
- See the [storage guide](storage.md) for lifetimes, namespaces and platform limits. State management is separate.

## Observability

- Use the vendor-independent `ErrorReporter` contract for technical reporting; keep Sentry imports and framework integration in `infrastructure/observability`. Inject reporting into consumers and keep domain telemetry-free. Application operations needing reporting define their own pure ports.
- Initialize the crash SDK once at the client process boundary before React mounts; this SDK-specific lifetime is an exception to ordinary dependency lifetimes, not a global service locator. Skip server rendering and disable remote reporting without configuration or in debug builds.
- Report once at the handling boundary, use fixed technical context, and avoid payloads, credentials and personal data. See [observability](observability.md) for privacy limits, native setup, source maps and activation.

## Bootstrap: composition and startup

- Bootstrap selects concrete adapters, injects operations and mounts providers through manual factories. Create composition/startup files only when needed; never export eager default instances or expose a global service locator.
- Composition connects dependencies; startup coordinates required preparation and invokes module operations for business workflows. SDK initialization stays in infrastructure; module providers/hooks stay in module presentation.
- Modules, shared code and infrastructure must not import bootstrap. Routes mount composed providers/navigation and delegate substantial assembly to bootstrap; consumers receive operations through props or focused providers.
- Give resources explicit app/session/feature lifetimes. Preserve instances across renders and release/reset them at lifecycle end. Use React lifecycle when needed.
- Prepare only what the initial UI requires; avoid unrelated remote dependencies or eager SDK/module initialization. Define failure and retry behavior for required asynchronous startup.

## Module boundaries and shared code

- Use business capabilities as module boundaries. Screens and individual actions usually belong inside an existing module. A module is not automatically a DDD Bounded Context. See [Adding a business module](add-module.md) for a worked example across the layers.
- Keep a module's implementation private. Introduce explicit public entry points when it has real consumers; do not create empty `index.ts` files now.
- Other modules must not reach into private screens, hooks, adapters or repository implementations.
- Public APIs must preserve layer rules. A core consumer must not import a barrel that re-exports React UI or concrete infrastructure; expose a focused pure contract entry point if necessary.
- Avoid cyclic module dependencies. Coordinate cross-module workflows in an explicit outer composition or workflow boundary, using contracts rather than private imports.
- Within a module, import the defining files with relative paths rather than its own public barrel or `@/modules/<name>/...` aliases, to avoid self-referencing dependency cycles.
- Move code to `shared/` only when its meaning and reasons to change match across consumers. A business entity or business component does not become shared merely because several screens use it.
- Keep context-specific models separate when their meaning differs. Do not create a universal shared domain model by default.

## Presentation, routing and mobile behavior

- Use Expo Router for navigation. Keep non-route files outside `src/app/`; routes adapt navigation input to module screens, and `_layout.tsx` files configure navigators. Do not implement business rules in routes or layouts.
- Keep UI state close to its consumers. Treat remote-data caching separately from business rules and workflow orchestration.
- Hooks may connect application operations to React and manage request/UI lifecycle. Move business decisions out of hooks into domain or application.
- Use platform-specific UI or adapter files where the platform requires different behavior. Do not spread device checks into the core.
- Add offline queues, persistence and synchronization only when required. Document consistency, retry and conflict behavior before introducing these responsibilities.

## Verification when implementing behavior

- Follow the root checks and [review responsibilities](../conventions/AGENTS.md#automated-checks-and-review). Lint enforces layer imports written as package names and `@/` aliases; it does not establish relative-path escapes, public entry point purity or semantic correctness.
- Follow [test naming and placement](../conventions/AGENTS.md#tests). Exercise domain and application through injected fakes without mounting React or contacting live services.
- Test adapter translations and important user journeys in proportion to the behavior changed. Keep end-to-end journeys separate when an end-to-end runner is introduced.
- Do not add a test framework, a dependency or an architectural enforcement tool solely to populate this skeleton.

## References

- [Expo Router source directory](https://docs.expo.dev/router/reference/src-directory/)
- [Expo Router core concepts](https://docs.expo.dev/router/basics/core-concepts/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Ports and Adapters](https://alistair.cockburn.us/hexagonal-architecture)
- [Bounded Context](https://martinfowler.com/bliki/BoundedContext.html)
