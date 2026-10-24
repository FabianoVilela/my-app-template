# Biome configuration and overrides

This guide explains the React checks, editor integration and four overrides in
root [biome.json](../../biome.json), configured for Biome 2.5.15.
[Project conventions](AGENTS.md) define the project's
naming and export policy; the configuration defines the checks Biome executes.
Keep them aligned when either changes. Verification commands belong in the
root [agent instructions](../../AGENTS.md#commands).

## React and React Native checks

The global recommended preset remains enabled. The `react` and `reactNative`
domains explicitly select `recommended`, documenting the intended framework
coverage without automatically opting into every experimental domain rule.
Recommended React checks include hook ordering, effect dependencies and keys.

The following additional rules are selected explicitly:

| Rule | Severity | Purpose |
| --- | --- | --- |
| `correctness.noNestedComponentDefinitions` | Error | Avoid defining components inside other components, which can reset state through remounting |
| `correctness.noReactPropAssignments` | Error | Reject assignments that mutate props |
| `suspicious.noLeakedRender` | Error | Prevent values such as `0` from leaking into conditional JSX |
| `nursery.noReactNativeDeepImports` | Error | Use public React Native exports instead of internal implementation paths |
| `nursery.noReactNativeRawText` | Error | Detect raw text outside recognized text containers |
| `nursery.useReactNativePlatformComponents` | Error | Check platform-specific native component imports |
| `nursery.useReactCompiler` | Warning | Report React Compiler diagnostics for inferred components and hooks |
| `nursery.noReactNativeLiteralColors` | Off | Defer automated color-token enforcement until a theme policy exists |

In the installed Biome 2.5.15, these React Native rules and the compiler rule
belong to `nursery`. Selecting a recommended domain alone does not enable its
nursery rules; keep the desired rules explicit. Recheck their groups and
behavior when upgrading Biome, since experimental rules can change.

React Compiler is already enabled in `app.json`. Its lint rule starts at
`warn` because it is experimental. The explicit `compilationMode: "infer"`
analyzes functions recognized as components or hooks and skips files without
such functions, avoiding the broader analysis of non-React utilities that
`all` would request. Review warnings even though they do not fail the current
lint command.

Prefer an explicitly boolean condition when rendering based on a count:

```tsx
// A count of zero can leak into the rendered output.
{items.length && <ItemsList items={items} />}

// The condition evaluates to a boolean.
{items.length > 0 && <ItemsList items={items} />}
```

If a custom text wrapper requires an exception to `noReactNativeRawText`, add
only actual text-rendering components through that rule's options. Do not
disable the rule broadly to accommodate arbitrary layout components.

Native accessibility semantics and runtime behavior still require review and
device verification. Biome is not assumed to provide identical coverage to
Expo's official ESLint preset. TypeScript remains configured with `strict`
and extends `expo/tsconfig.base`; lint does not replace type checking.

## JSX boolean shorthand

Use an implicit JSX prop for literal `true`: `<Button disabled />` is accepted,
while `<Button disabled={true} />` is an error. Keep other values explicit,
including `<Button disabled={false} />` and
`<Button disabled={isSubmitting} />`. This shorthand passes `true` regardless
of the component's default prop values; omitting the prop altogether has
different semantics.

Biome 2.5.15 has no built-in rule that enforces this direction. The root
configuration registers the local
[`use-jsx-boolean-shorthand.grit`](../../scripts/biome/use-jsx-boolean-shorthand.grit)
plugin instead. It runs inside Biome through the existing lint/check commands
and editor integration, with no additional linter or runtime dependency.
Keep `noImplicitBoolean` disabled because it enforces the opposite convention.

The plugin structurally matches JSX attribute expressions that are the literal
`true`, including redundant parentheses, independently of the component or prop
name. It reports an error in Biome's `plugin` diagnostic category. It does not evaluate dynamic
expressions or rewrite code automatically; remove `={true}` manually. Ordinary
JavaScript object properties, strings and comments are outside its match.
Verify its syntax-node pattern against the installed version when upgrading
Biome.

## VS Code integration

The workspace recommends `biomejs.biome` alongside the Expo extension. For
JavaScript, JSX, TypeScript, TSX, JSON and JSONC, workspace settings select
Biome as the formatter and enable formatting on save. Explicit saves also
request `source.fixAll.biome` and `source.organizeImports.biome`, using safe
fixes and the repository's import organization configuration.

These language-scoped actions replace the previous generic fix, import and
member-sorting actions. Other file types keep their editor formatter settings.
The CLI's file selection and VCS ignores remain authoritative for project
verification; the editor settings do not expand Biome's configured scope.

## Scope and precedence

The overrides refine the global configuration for selected source files:

| Match | Purpose |
| --- | --- |
| `src/**` | Named exports, file naming and identifier naming |
| `src/app/**` | Allow default exports for routes and layouts |
| `src/infrastructure/**`, `src/modules/*/infrastructure/**` | Allow external casing for selected property declarations |
| `src/app/**/\\[*.{ts,tsx}` | Validate dynamic route parameter filenames in `camelCase` |

`**` spans directory levels; `*` matches within one path segment. The module
pattern therefore works with any immediate module directory name. These rules
apply to the source languages they support, such as JavaScript and TypeScript.
Global file selection and VCS ignores still determine which files are checked.

Several overrides can apply to one file. Later matching overrides take
precedence for conflicting settings; unrelated rules remain active. For
example, a route keeps identifier naming checks while receiving an exception
for default exports. An `error` diagnostic fails lint/check; `off` disables the
selected rule for that scope.

Root configuration files and scripts outside `src/` can receive global checks,
but these source-specific overrides do not impose their naming/export policy
on those files.

## General source conventions

### Named exports

`noDefaultExport: "error"` favors explicit, consistent exported names:

```tsx
export function UserCard() {
  return null;
}
```

The default-export form is reported outside `src/app/`:

```tsx
export default function UserCard() {
  return null;
}
```

The rule also reports `export { UserCard as default }`. It checks the current
file's ESM exports; consuming a dependency's default export remains valid,
for example `import axios from "axios"`. CommonJS exports are outside this
rule's coverage. Biome provides no automatic fix for this rule.

### File names

`useFilenamingConvention` selects `kebab-case`, with `strictCase: true` and
`requireAscii: true`.

| Filename | Result |
| --- | --- |
| `user-profile.ts`, `user-card.tsx` | Accepted |
| `http-client.native.ts`, `user-card.test.tsx` | Accepted |
| `UserProfile.ts`, `userProfile.ts`, `user_profile.ts` | Reported |
| `user-é.ts` | Reported: non-ASCII character |

The rule recognizes special filename notation such as `_layout.tsx` and
`+not-found.tsx`. Lowercase extension segments allow platform and test suffixes.
`strictCase` controls consecutive uppercase letters in case styles such as
`camelCase` and `PascalCase`; `kebab-case` already supplies the main restriction
for ordinary source filenames. `requireAscii` rejects non-ASCII characters.

This rule checks file basenames and extensions. Directory names and whether a
name is English still require review. Renaming files requires updating their
consumers; route renames also require considering URLs and deep links.

### Identifiers

`useNamingConvention` uses Biome's built-in conventions, with
`strictCase: false` and `requireAscii: true`.

| Declaration | Relevant forms accepted by the rule |
| --- | --- |
| Classes, interfaces and type aliases | `PascalCase` |
| Functions, variables and parameters | `camelCase` or `PascalCase` |
| Module-level `const`/`var` bindings | Also permit `UPPER_SNAKE_CASE` |
| Ordinary object/type properties | Normally `camelCase`; some readonly members permit constant casing |

The rule accepts names such as `UserProfile`, `loadUser`, `userId` and
`DEFAULT_TIMEOUT_MS` in their corresponding declarations. It reports ordinary
bindings such as `user_name` and type names such as `user_profile`.

`strictCase: false` permits acronym forms such as `HTTPClient` and `userID`.
`requireAscii: true` remains active, so `userÉ` is reported. ASCII validation
does not determine whether a name is English.

The built-in rules permit forms beyond the project's preferred conventions.
For example, `IUser` can pass the casing check even though project conventions
prefer types without redundant prefixes. The rule also does not determine
whether a function is a component, whether a boolean needs `is`/`has`, or
whether a callback should use `on` rather than `handle`.

Some declarations are ignored by the rule, including named imports without
aliases, destructured property names, members marked `override` and declarations
inside external/global TypeScript declarations. Review integration-required
names and semantic conventions independently of lint results.

## Route exports

The `src/app/**` override turns only `noDefaultExport` off. This allows the
default component exports required by the project's route/layout convention:

```tsx
export default function OrdersScreen() {
  return null;
}
```

The other source naming rules remain active. Disabling this rule permits default
exports; it does not verify that every route has the required default export.
Keep non-route helpers outside `src/app/` as required by the architecture.

## Infrastructure property names

The infrastructure override applies to root infrastructure and to the
infrastructure layer of every module. It adds two `useNamingConvention`
exceptions:

| Selector | Selected declarations |
| --- | --- |
| `objectLiteralProperty` | Properties in object literals |
| `typeProperty` | Properties in type aliases and interfaces |

Both use `match: ".*"` without a `formats` requirement. This accepts the casing
of those selected property names while retaining ASCII validation. Other
declarations keep the normal naming checks.

External APIs, storage formats and SDK contracts may require property names
that the application does not control:

```ts
// Infrastructure: names required by an external schema.
export type ApiUser = {
  user_id: string;
  full_name: string;
};
```

When conversion is useful, the owning adapter can expose an application-owned
model with `userId` and `fullName`. See the architecture's
[adapter responsibilities](../architecture/AGENTS.md#adapters-and-composition).

The exception is restricted to infrastructure because this layer owns external
schemas. Domain, application, presentation and shared application code retain
the normal property naming checks. A genuine integration requirement elsewhere
should receive a documented exception with the smallest practical scope.

The override covers every selected property in those directories, including
properties of internal objects. Keep application-owned properties in
`camelCase`, including inside infrastructure; lint cannot determine whether a
particular field belongs to an external contract.

| Declaration inside infrastructure | Result |
| --- | --- |
| Object property or type/interface property `user_id` | Accepted |
| Variable `user_name` or type name `api_user` | Reported |
| Filename `api_user.ts` | Reported by the unchanged filename rule |
| Property `userÉ` | Reported by ASCII validation |

## Dynamic route filenames

The last override selects filenames beginning with a literal `[` below
`src/app/` and ending in `.ts` or `.tsx`. In the JSON glob, `\\[` escapes the
opening bracket so it is treated as part of the filename.

It changes the filename case to `camelCase` and supplies this `match` expression:

```regex
\[(?:[.][.][.])?([a-zA-Z][a-zA-Z0-9]*)\][.](.+)
```

| Expression part | Meaning |
| --- | --- |
| `\[` and `\]` | Literal brackets around the parameter |
| `(?:[.][.][.])?` | Optional catch-all prefix `...`, without a capture |
| `([a-zA-Z][a-zA-Z0-9]*)` | First capture: parameter name |
| `[.]` | Literal dot before the extensions |
| `(.+)` | Second capture: extension segments |

Biome validates the first capture as the filename and the second as its
extensions. This allows `orderId` to be checked separately from brackets and
platform suffixes. A custom `match` supplies its own filename parsing instead
of relying on the rule's built-in special-name handling.

| Filename | Result |
| --- | --- |
| `[orderId].tsx`, `[...orderIds].tsx` | Accepted |
| `[orderId].web.tsx`, `[orderId].ios.tsx` | Accepted |
| `[order_id].tsx`, `[OrderId].tsx` | Reported |
| `[orderID].tsx` | Reported: `strictCase` is `true` here |

Identifier naming inside the file still uses `strictCase: false`; the stricter
setting applies to the parameter filename. This override checks filenames,
so a directory such as `[order_id]/index.tsx` still needs manual review of its
parameter spelling.

## Maintenance and coverage

- Preserve explicit defaults for readability when editing the configuration.
- Update project conventions, this guide and the configuration together when
  intentionally changing a policy. Verify behavior against the installed Biome
  version when upgrading it.
- Keep the route and external-schema exceptions narrowly scoped. Broadening
  them also relaxes checks for unrelated code in the selected paths.
- Use the root verification workflow. `check:fix` can apply supported fixes,
  but filename changes and default-export changes require manual work.
- Review architectural layer/module imports, directory names, file placement,
  semantic naming and intended public APIs separately. These four overrides do
  not enforce architectural import boundaries.

## References

- [Biome domains](https://biomejs.dev/linter/domains/)
- [React Compiler lint rule](https://biomejs.dev/linter/rules/use-react-compiler/)
- [Biome linter plugins](https://biomejs.dev/linter/plugins/)
- [Biome GritQL syntax](https://biomejs.dev/reference/gritql/)
- [Biome VS Code extension](https://biomejs.dev/reference/vscode/)
- [React Compiler in Expo](https://docs.expo.dev/guides/react-compiler/)
- [Biome configuration and overrides](https://biomejs.dev/reference/configuration/#overrides)
- [noDefaultExport](https://biomejs.dev/linter/rules/no-default-export/)
- [useFilenamingConvention](https://biomejs.dev/linter/rules/use-filenaming-convention/)
- [useNamingConvention](https://biomejs.dev/linter/rules/use-naming-convention/)
