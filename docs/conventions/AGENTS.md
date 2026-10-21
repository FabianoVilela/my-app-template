# Project conventions

## Scope and ownership

The root [AGENTS.md](../../AGENTS.md) explicitly requires these conventions when creating, renaming, moving or editing project files throughout the repository. Their location under `docs/conventions/` does not automatically give them that scope. More specific `AGENTS.md` instructions take precedence within their directory scope; explicit user instructions take precedence over these documents.

This document owns naming, file organization and code style. Follow [Application architecture](../architecture/AGENTS.md) for layer responsibilities, allowed dependencies and module boundaries, and the root instructions for commands, documentation lookup and verification.

Rules such as `kebab-case`, named exports and handler names are project choices, not universal React Native or Expo requirements. Framework-required filenames and exports take precedence. Apply these conventions to new and changed code; avoid unrelated mass renames or formatting changes.

## Files and directories

- Use English for new code identifiers, filenames and directory names. Keep business terminology consistent; user-visible text follows the product's language requirements.
- Use lowercase `kebab-case` for ordinary source directories and file basenames. Use `.tsx` for files containing JSX and `.ts` for other TypeScript files.
- Prefer descriptive names over generic `data.ts`, `helpers.ts` or `manager.ts`. Add a suffix only when it communicates an actual responsibility.

| Purpose | Filename or directory | Exported identifier example |
| --- | --- | --- |
| Business module | `order-management/` | Not applicable |
| Domain concept | `order.ts` | `Order` |
| Application operation | `cancel-order.ts` | `cancelOrder` |
| Capability contract | `order-repository.ts` | `OrderRepository` |
| Concrete adapter | `http-order-repository.ts` | `createHttpOrderRepository` |
| Screen | `orders-screen.tsx` | `OrdersScreen` |
| UI component | `order-card.tsx` | `OrderCard` |
| React hook | `use-orders.ts` | `useOrders` |
| Dependency assembly | `create-dependencies.ts` | `createDependencies` |
| Provider composition | `app-providers.tsx` | `AppProviders` |
| Coordinated startup | `startup.ts` | `startup` |

- These examples describe names, not files or abstractions to create. Preserve the numbered template modules until real product requirements replace them.
- Keep related implementation files together within their architectural layer. Start with a file; introduce a component subdirectory only when related files make it useful. Do not create a folder and `index.tsx` wrapper for every component.
- Preserve empty template directories with `.gitkeep`. Remove the placeholder when adding real files directly to its directory. Create new directories only for current responsibilities.
- Preserve tool-required names such as `AGENTS.md`, `README.md`, `package.json`, `pnpm-lock.yaml`, `tsconfig.json` and Expo configuration files. Do not rename generated files or vendor asset bundles to enforce `kebab-case`.
- Use exact filename casing in imports. Avoid paths that differ only in letter case, spaces or accents in new ordinary source paths.

## Identifiers

- Use `PascalCase` for React components, classes, types and interfaces; use `camelCase` for functions, variables, object properties and parameters.
- Name custom hooks `use` followed by a capital letter, such as `useOrders`. Reserve this prefix for functions that use React hooks; name pure helpers after their operation.
- Name component props `<ComponentName>Props`, such as `OrderCardProps`. Use descriptive types without redundant `I` or `T` prefixes, such as `OrderRepository` rather than `IOrderRepository`.
- Use affirmative boolean names such as `isLoading`, `hasItems`, `canSubmit` and `shouldRetry`. Name callbacks `on<Action>` in props and local event handlers `handle<Action>`, such as `onCancel` and `handleCancel`.
- Use `camelCase` for ordinary constants and `UPPER_SNAKE_CASE` for module-level fixed configuration constants, such as `MAX_RETRY_COUNT`. Do not uppercase every `const` binding.
- Keep external payload field names at integration boundaries when required by their schema; map them to internal conventions in the owning adapter when a conversion is needed.

## Imports and exports

- Prefer named exports for application code. Use a default component export for Expo Router screens and layouts, and preserve default exports required by tool configuration or external APIs.
- Use existing `@/` aliases for imports across source directories and `@/assets/` for root assets; use relative imports for nearby files in the same directory or local subtree. Do not add alternative aliases for the same paths.
- Use `import type` for imports used only as types. Let Biome organize imports and formatting instead of maintaining a competing manual order.
- Prefer direct imports from defining files within a module. Add explicit public entry points only for real consumers, following the architecture's [module boundary rules](../architecture/AGENTS.md#module-boundaries-and-shared-code). Avoid broad `export *` barrels that mix layers or create cycles.

## Expo Router filenames

- Keep route files in `src/app/`; keep components, hooks, styles, constants, tests and other non-route helpers outside it, in the locations defined by the architecture.
- Use `kebab-case` for static route segments, such as `order-history.tsx`. Route filenames define public URLs and deep links; treat renames as navigation changes and update affected links and consumers.
- Preserve special notation: `index.tsx` for a directory's default route, `_layout.tsx` for its layout, `[orderId].tsx` for a dynamic parameter, `[...slug].tsx` for a catch-all and `(tabs)/` for a route group. Use `camelCase` for dynamic parameter identifiers and preserve their spelling in consumers.
- Preserve the `+` notation for special Router files, such as `+not-found.tsx`; consult the installed Router version's documentation before introducing other special files. Do not create these files as placeholders.

See [Expo Router notation](https://docs.expo.dev/router/basics/notation/) and [core concepts](https://docs.expo.dev/router/basics/core-concepts/).

## Platform variants

- Put the platform suffix immediately before the language extension: `order-card.ios.tsx`, `order-card.android.tsx`, `order-card.native.tsx` or `order-card.web.tsx`. Use the same convention for `.ts` adapters.
- Import the base module path, such as `./order-card`, so platform resolution selects the implementation. Keep the exported contract consistent across variants and ensure every supported platform has an implementation.
- Inside `src/app/`, a platform variant must also have a non-platform route or layout file: `about.web.tsx` needs `about.tsx`; `_layout.web.tsx` needs `_layout.tsx`. Prefer putting substantial platform implementations outside routes.
- Keep small presentation differences local; split implementations when differences become substantial. Follow architectural boundaries for UI and device adapters.

See [React Native platform-specific code](https://reactnative.dev/docs/platform-specific-code) and [Expo Router platform extensions](https://docs.expo.dev/router/advanced/platform-specific-modules/).

## TypeScript, components and styles

- Preserve TypeScript strict mode. Prefer inferred local types and explicit public contracts; use `unknown` and narrow it for untrusted values rather than introducing `any` or unchecked assertions.
- Prefer function components with typed props. Keep one primary component per file; small private helpers may remain in that file. Extract reusable hooks and components when they have a clear responsibility.
- Keep styles close to their component. Use descriptive `camelCase` style keys such as `container`, `headerTitle` and `submitButton`. Split into a nearby `<component>.styles.ts` only when it improves readability.
- Reuse existing theme tokens and shared UI before adding repeated colors, spacing or typography. Follow the project's existing styling setup; do not introduce a styling library solely to apply these conventions.
- Give interactive controls meaningful accessible names, roles and states; add a label when visible content does not provide one. A `testID` does not replace accessibility semantics. Follow [React Native accessibility](https://reactnative.dev/docs/accessibility).
- Follow the [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks): call hooks from React components or custom hooks, respecting their ordering rules rather than invoking them from event handlers or ordinary helpers.

## Assets and configuration

- Keep bundled images and other static assets under root `assets/`, grouped by kind when needed. Use descriptive lowercase `kebab-case` for new asset basenames; preserve font family filenames, tool-managed bundles and resolution suffixes such as `@2x` and `@3x` when providing [density variants](https://reactnative.dev/docs/images#static-image-resources).
- Use `UPPER_SNAKE_CASE` for environment variable names. Client configuration exposed by Expo uses `EXPO_PUBLIC_`, such as `EXPO_PUBLIC_API_URL`, read with static dot notation: `process.env.EXPO_PUBLIC_API_URL`.
- Treat values embedded in the client bundle as public; never put secrets in `EXPO_PUBLIC_` variables. When adding environment requirements, document names and non-sensitive example values in `.env.example`; keep local overrides out of version control. Follow [Expo environment variables](https://docs.expo.dev/guides/environment-variables/).

## Tests

- When a suitable runner is configured, name unit and component tests `<basename>.test.ts` or `<basename>.test.tsx` and colocate them with the code they verify, within the same architectural layer and outside `src/app/`.
- Keep end-to-end journeys in a separate directory chosen for the installed runner. Name test cases after observable behavior; prefer accessible queries and use stable, descriptive `kebab-case` test IDs when IDs are needed.
- The template currently has no test runner. These naming rules do not authorize adding one solely to populate directories; follow the root verification instructions and architecture's [behavior verification rules](../architecture/AGENTS.md#verification-when-implementing-behavior).

## Maintaining these instructions

- Keep rules actionable and examples aligned with the repository. Update this document when intentionally changing a convention; update architecture only when responsibilities or dependency rules change.
- Use standard Markdown, relative links for repository documents and explicit scope references. Keep workflow commands in the root instructions and avoid copying them here. Follow the [AGENTS.md guidance](https://agents.md/).
- Biome and TypeScript are the existing automated checks. Naming, file placement and architectural boundaries still require review; do not claim that current tooling enforces every convention in this document.
