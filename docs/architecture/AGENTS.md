# Application architecture instructions

## Scope and intent

The root [AGENTS.md](../../AGENTS.md) explicitly requires these instructions for application code throughout `src/`. Its location under `docs/architecture/` does not automatically give it scope over `src/`.

For file and directory names, identifier style, imports and exports, route notation, platform suffixes and test filenames, follow [Project conventions](../conventions/AGENTS.md). This document owns layer responsibilities, dependency direction and module boundaries.

Use business modules with inward-pointing dependencies, inspired by Clean Architecture, Ports and Adapters, and DDD. Keep the structure useful for medium to large applications without requiring abstractions that have no current responsibility.

This is a reference template. `module-1`, `module-2`, and `module-3` demonstrate the same module structure and contain no business behavior. In a product derived from this template, name modules after business capabilities.

## Source structure

```text
src/
├── app/                          # Expo Router routes and layouts
├── bootstrap/                    # Dependency composition, providers and startup
├── modules/
│   ├── module-1/
│   │   ├── domain/
│   │   ├── application/
│   │   │   └── ports/
│   │   ├── infrastructure/
│   │   └── presentation/
│   │       ├── screens/
│   │       ├── components/
│   │       └── hooks/
│   ├── module-2/                 # Same internal structure
│   └── module-3/                 # Same internal structure
├── infrastructure/
│   ├── http/
│   ├── storage/
│   └── observability/
└── shared/
    ├── ui/
    └── lib/
```

- Do not add dummy screens, entities, repositories, providers, or empty TypeScript entry points to fill the skeleton.
- For new product modules, create only the directories needed by their current responsibilities. The complete template tree is an illustration, not a requirement to populate every layer.
- These business modules under `src/modules/` are not Expo native modules. Do not change Expo native-module discovery or native-project configuration to accommodate them.

## Module boundaries

- Use business capabilities as module boundaries. Screens and individual actions usually belong inside an existing module. A module is not automatically a DDD Bounded Context.

## Responsibilities and allowed dependencies

The following rules concern source imports, including type imports. Runtime calls to an injected adapter do not authorize importing its concrete implementation into the application core.

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

## Domain and application boundaries

- Keep domain and application independent of React, React Native, Expo, routing, HTTP clients, device storage and state/cache libraries.
- Represent rules with types and functions by default. Use classes, entities, value objects or aggregates when they protect a real invariant or clarify behavior.
- Keep stable business rules in domain; put workflow orchestration in application. Loading indicators, translated messages, modal state and navigation belong to presentation.
- Define ports next to the policy that needs them. Put use-case integration contracts in `application/ports/`; a contract genuinely owned by the domain may live in domain.
- Ports can be interfaces or function types. Name them by required capabilities, not vendor APIs. Do not create a generic repository or a use-case interface for every function.
- Inject external capabilities into application operations through explicit parameters or factories. Do not import concrete adapters, global service locators or React contexts into the core.
- Keep simple operations small. Do not add pass-through layers or duplicate models solely to satisfy a diagram.
- Model only the business knowledge the client needs. Server-side authorization and authoritative consistency checks remain necessary even when the client performs early validation.

## Adapters and composition

- Put module-specific endpoints, external payloads, persistence details and data conversions inside that module's infrastructure.
- Preserve schema-required field names in infrastructure DTOs and request payloads. Translate external formats and errors at the adapter boundary when needed; application-owned models follow the [project naming conventions](../conventions/AGENTS.md#identifiers). Core contracts must not expose vendor-specific response or error types.
- Share technical mechanisms in root infrastructure only when they are actually reused. Keep business-specific adapters with their module.

## HTTP integrations

- Use the shared `HttpClient` contract in `infrastructure/http/` for HTTP execution. Keep imports of the `axios` package inside its concrete adapter; public request, response and error types must be library-independent.
- Group related endpoints in module infrastructure services. Receive the HTTP client explicitly when constructing a service, and define consumed capabilities in application contracts without HTTP imports. Do not add pass-through use cases or a second gateway object solely to wrap a service.
- Select default clients and inject overrides in bootstrap when there are real services to assemble. Preserve instance lifetimes; do not create default clients through eager module-level exports or import bootstrap from services.
- Keep endpoint-specific error decisions and payload validation in module infrastructure. Do not introduce global status-to-`null` conversions, automatic retries, refresh or UI reactions in the transport.
- Follow the [HTTP client guide](http-client.md) for the implemented transport contract, composition examples, optional configuration and extension points. Keep example product code in documentation; preserve the numbered template modules.

## Bootstrap: composition and startup

- Use `bootstrap/` as the application's composition root: select concrete adapters, supply them to application operations and compose the providers used by the UI. Use manual factories and explicit dependencies; a dependency-injection framework is not required.
- Keep composition distinct from startup. Composition connects dependencies; startup coordinates required preparation, such as restoring a session or activating observability. Invoke module operations for business workflows rather than implementing their rules here.
- Create composition and startup files only when needed; follow the filename examples in [Project conventions](../conventions/AGENTS.md#files-and-directories). Use React components or hooks when preparation requires React lifecycle behavior.
- Keep module-specific providers and consumer hooks in their module's presentation layer. Bootstrap mounts those providers; screens use the module's hooks. Keep SDK initialization implementations in the relevant infrastructure adapter and coordinate their activation from bootstrap when needed.
- `bootstrap/` may import concrete module adapters and presentation providers for assembly. Modules, shared code and infrastructure must not import bootstrap. Supply assembled operations through props or focused providers rather than a global service locator.
- Let `app/_layout.tsx` mount the composed providers and navigation, delegating substantial assembly and startup coordination to bootstrap. Do not place non-route helper files inside `app/`.
- Give resources an explicit lifetime: app-wide, session-specific or feature-specific as needed. Preserve instances across ordinary renders, and reset or release resources when their owning lifecycle ends.
- Wait only for preparation required by the initial UI. Avoid eagerly initializing every module, SDK or native capability, or blocking startup on unrelated remote data. Define failure and retry behavior for required asynchronous preparation.

## Module boundaries and shared code

- Keep a module's implementation private. Introduce explicit public entry points when it has real consumers; do not create empty `index.ts` files now.
- Other modules must not reach into private screens, hooks, adapters or repository implementations.
- Public APIs must preserve layer rules. A core consumer must not import a barrel that re-exports React UI or concrete infrastructure; expose a focused pure contract entry point if necessary.
- Avoid cyclic module dependencies. Coordinate cross-module workflows in an explicit outer composition or workflow boundary, using contracts rather than private imports.
- Within a module, import the defining files rather than its own public barrel to avoid self-referencing dependency cycles.
- Move code to `shared/` only when its meaning and reasons to change match across consumers. A business entity or business component does not become shared merely because several screens use it.
- Keep context-specific models separate when their meaning differs. Do not create a universal shared domain model by default.

## Presentation, routing and mobile behavior

- Keep non-route files outside `src/app/`. Routes adapt navigation input to module screens; do not implement business rules in routes or layouts.
- Keep UI state close to its consumers. Treat remote-data caching separately from business rules and workflow orchestration.
- Hooks may connect application operations to React and manage request/UI lifecycle. Move business decisions out of hooks into domain or application.
- Use platform-specific UI or adapter files where the platform requires different behavior. Do not spread device checks into the core.
- Add offline queues, persistence and synchronization only when required. Document consistency, retry and conflict behavior before introducing these responsibilities.

## Verification when implementing behavior

- Follow the root verification instructions. Biome checks import cycles, including type-only cycles, and explicitly annotated private/package exports. Layer and module import boundaries, public API usage and semantic responsibilities still require review.
- When a test setup is available, follow [test naming and placement](../conventions/AGENTS.md#tests). Exercise domain and application through injected fakes without mounting React or contacting live services.
- Test adapter translations and important user journeys in proportion to the behavior changed. Keep end-to-end journeys separate when an end-to-end runner is introduced.
- Do not add a test framework, a dependency or an architectural enforcement tool solely to populate this skeleton.

## References

- [Expo Router source directory](https://docs.expo.dev/router/reference/src-directory/)
- [Expo Router core concepts](https://docs.expo.dev/router/basics/core-concepts/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Ports and Adapters](https://alistair.cockburn.us/hexagonal-architecture)
- [Bounded Context](https://martinfowler.com/bliki/BoundedContext.html)
