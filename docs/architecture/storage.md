# Local persistence

The template provides two library-independent contracts in
`src/infrastructure/storage/`:

| Contract | Implementation | Purpose |
| --- | --- | --- |
| `LocalStorage` | `createMmkvStorage` in `mmkv-storage.ts` | Synchronous persistence of non-sensitive preferences, settings and serialized state. |
| `SecureStorage` | `createExpoSecureStorage` in `expo-secure-storage.ts` | Asynchronous device-protected persistence of tokens and credentials. |

MMKV is a key-value mechanism here, not a local database. Keep relational data,
queries, offline queues and synchronization outside these adapters. Zustand is
not installed or integrated at this stage.

## Contract

Both contracts expose `getItem`, `setItem` and `removeItem` with string keys and
values. Only the secure contract returns promises. `getItem` returns `null` for
missing entries and preserves an empty string. SecureStore can also return `null`
for entries invalidated by the operating system. Removing a missing entry
succeeds. Writes replace the value under the selected key.

Use stable, nonempty keys composed of ASCII letters, numbers, `.`, `-` and `_`
for compatibility with both backends. JSON serialization and validation belong to
the consuming infrastructure adapter. Read JSON as `unknown` and validate its
schema before exposing application models. The shared storage never parses JSON,
adds defaults, resets invalid values, or converts failed reads into missing data.
Keep persisted payloads small; MMKV runs synchronously on the JavaScript thread,
and native SecureStore implementations may reject large strings.

The local contract's string operations can later support a state persistence
adapter. It has no dependency on Zustand and exposes no MMKV types or React hooks.
Persist only the non-sensitive fields required by that state.

## Namespaces and lifetime

`createMmkvStorage({ id })` creates one named MMKV instance. The ID is required;
different IDs select separate stores. Reusing an ID reopens the same persisted
store on a device. `createExpoSecureStorage({ service })` uses the selected
service for every read, write and removal. Empty or whitespace-only namespaces
throw `RangeError` before accessing the backend.

Choose stable namespaces deliberately. Changing an ID or service does not move
existing entries. Prefix module-owned keys to avoid collisions. A module's
infrastructure owns its keys, serialization, migrations and credential cleanup;
there is no global clear-all operation. Clearing MMKV does not clear SecureStore.
Remove each owned credential explicitly when implementing logout.

Factories do not export eagerly created instances. The MMKV factory opens its
store when explicitly called; the SecureStore factory does not access device
storage during construction. Compose and retain instances in bootstrap when real
consumers exist, rather than recreating them on each render:

```ts
// Example for bootstrap once real consumers exist; no singleton on import.
import { createExpoSecureStorage } from "@/infrastructure/storage/expo-secure-storage";
import type { LocalStorage } from "@/infrastructure/storage/local-storage";
import { createMmkvStorage } from "@/infrastructure/storage/mmkv-storage";
import type { SecureStorage } from "@/infrastructure/storage/secure-storage";

type StorageOverrides = {
  preferences?: LocalStorage;
  credentials?: SecureStorage;
};

export function createDependencies(overrides: StorageOverrides = {}) {
  return {
    preferences:
      overrides.preferences ?? createMmkvStorage({ id: "app.preferences" }),
    credentials:
      overrides.credentials ??
      createExpoSecureStorage({ service: "app.credentials" }),
  };
}
```

Keep domain and application independent of device storage. Module infrastructure
can consume these technical contracts and implement focused application ports.
For presentation state, bootstrap can supply the persistence capability when
assembling the future state store. No placeholder business services, startup work,
providers or state stores are added to the template.

## Failures

Backend failures throw or reject with `StorageError`:

| `kind` | Meaning |
| --- | --- |
| `initialization` | MMKV could not open the selected instance. |
| `read` | Reading or checking availability failed. |
| `write` | Writing or checking availability failed, including invalid SecureStore keys. |
| `remove` | Removing or checking availability failed. |
| `unavailable` | SecureStore is not supported in the current environment. |

Errors expose a stable `kind` and an opaque diagnostic `cause`. Their messages
do not interpolate keys or values. Native causes may contain sensitive details:
do not log or serialize causes indiscriminately. Translate technical failures
into module-specific meaning when an application operation needs to distinguish
them. Recovery, defaults and retry decisions belong to consumers.

## Native and web behavior

- MMKV 4 uses `react-native-nitro-modules`. Both dependencies are installed.
  Native autolinking and Expo Continuous Native Generation configure them; no
  generated `ios/` or `android/` files are edited manually. MMKV requires a
  development build rather than Expo Go. Rebuild with `pnpm ios` or
  `pnpm android` when running the app with native persistence.
- On web, MMKV uses its own `localStorage` implementation. If browser storage
  is disabled, the library falls back to memory, so persistence across reloads
  is not guaranteed. Create browser persistence only on the client; do not
  instantiate user storage in a shared server-rendering process.
- SecureStore is supported on native platforms, not web. Every secure operation
  checks `isAvailableAsync` and rejects with `StorageError("unavailable")` when
  unsupported. There is no fallback of credentials to MMKV, browser storage or
  memory. A web authentication strategy must be designed separately.
- The SecureStore adapter uses asynchronous methods and
  `WHEN_UNLOCKED_THIS_DEVICE_ONLY`: on iOS, entries are accessible while the
  device is unlocked and do not migrate to another device through backup.
  Biometric authentication and background access are not enabled.
- The `expo-secure-store` config plugin is registered in `app.json`, including
  its default Android backup exclusions. Android credentials are lost on
  uninstall; iOS Keychain entries can survive reinstall with the same bundle
  identifier. Do not assume uninstall clears credentials or use SecureStore as
  the sole copy of irreplaceable data.

## Verification

```bash
pnpm test --runTestsByPath src/infrastructure/storage/mmkv-storage.test.tsx src/infrastructure/storage/expo-secure-storage.test.tsx
```

Both suites use the native Jest project. MMKV supplies an in-memory test
implementation; the suite blocks Nitro's native bootstrap. Tests cover string
round trips, empty values, missing keys, overwrites, targeted removal, namespace
configuration and normalized failures. The library mock does not simulate
reopening a file or sharing instances by ID. SecureStore tests use Expo's native
mocks and scoped spies to check asynchronous calls, service and accessibility
options, unsupported platforms, invalid keys and failure propagation.

These tests do not verify disk durability, actual Keychain/Keystore protection,
browser storage or OS reinstall/backup behavior. Validate those on real iOS and
Android development builds and in a browser when connecting real consumers.

## References

- [MMKV 4 installation, APIs, web behavior and test support](https://github.com/margelo/react-native-mmkv)
- [Expo SecureStore for SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/securestore/)
