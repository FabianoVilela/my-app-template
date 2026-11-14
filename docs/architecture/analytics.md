# Analytics

The template can use Google Analytics for Firebase through
`@react-native-firebase/analytics`, behind the vendor-independent `AnalyticsTracker`
contract in `infrastructure/analytics/analytics-tracker.ts`. It is optional and
inert by default: without configuration no Firebase code is linked natively, and
with configuration nothing is collected until the app records the user's consent.
The contract records consent, screen views and events. It does not set user IDs
or user properties, and it does not mirror the Firebase SDK.

## Activation

Firebase is selected per [app variant](../app-variants.md#selecting-configuration)
with build-time variables. They are not `EXPO_PUBLIC_*` values:

- `FIREBASE_SERVICES`: `analytics`, `crashlytics` or both, comma-separated. Empty
  keeps Firebase out of the build.
- `GOOGLE_SERVICES_JSON` and `GOOGLE_SERVICE_INFO_PLIST`: paths, relative to the
  repository root, to the variant's Android and Apple app config files. They are
  required when a service is selected.

`scripts/firebase-config.cjs` reads this selection once. Both `app.config.ts` and
`react-native.config.js` use it, so native linking, config plugins and the runtime
flag cannot disagree. With a service selected, the app config:

- sets `googleServicesFile` for both platforms and adds the
  `@react-native-firebase/app` plugin;
- sets `expo-build-properties` `ios.useFrameworks: "dynamic"`, which Firebase
  Apple SDK 13+ requires because it is distributed only through Swift Package
  Manager;
- adds the Analytics plugin with `ios.withoutAdIdSupport` and blocks the Android
  `com.google.android.gms.permission.AD_ID` permission;
- exposes `extra.firebase`, which `readEnv()` validates as `env.firebase`.

Without a selection, `react-native.config.js` removes every `@react-native-firebase/*`
package from autolinking, and iOS keeps static linking.
Configuration fails when a config file is unreadable or registered for another
variant's bundle identifier or package name. Use one Firebase project per variant,
as Firebase recommends, so development and staging data never mix with production.

The config files are Git-ignored by default. Firebase does not treat them as
secrets, but a derived app should decide deliberately whether to commit them or
supply them from CI. Build native binaries only through the package scripts
(`pnpm ios`, `pnpm android:staging` and so on). They load the variant
environment before CocoaPods and Gradle evaluate `react-native.config.js`. Run
`prebuild --clean` after changing the selection.

## Collection and consent

`firebase.json` holds the native defaults that React Native Firebase applies at
build time:

- automatic collection is disabled (`analytics_auto_collection_enabled: false`);
- every Consent Mode type defaults to denied (`analytics_default_allow_*`);
- advertising ID and Android SSAID collection are disabled;
- automatic screen reporting is disabled, so screen views come only from the app.

`setCollectionConsent(true)` grants `analytics_storage` and enables collection.
`setCollectionConsent(false)` denies it and disables collection again. The
advertising signals (`ad_storage`, `ad_user_data`, `ad_personalization`) always
stay denied. The SDK persists the setting across launches. The consent screen,
the legal basis and when to ask belong to the derived app. The template has no
consent UI, so it sends no analytics until one is added. Consent failures reject,
so the caller can keep its own record accurate. Logging failures are swallowed.

Debug builds never use the SDK: `initializeAnalytics()` returns the no-op tracker
under `__DEV__`. Web always uses the no-op tracker.

## Composition and screen tracking

The root layout calls `initializeAnalytics()` once per process, before React
mounts, and passes the tracker to `AppNavigation`. Bootstrap loads the Firebase
adapters with a lazy `require` only when selected, because React Native Firebase
throws at import time when its native module is not linked. Never import the
Firebase adapters statically from a module that every build evaluates.
`tests/root-layout.test.tsx` mounts the real layout without Firebase mocks and
guards this. `useScreenTracking` logs one
`screen_view` per navigation. The screen name is the Expo Router route pattern:
groups are dropped and dynamic segments keep their placeholder, so
`/(tabs)/items/42` reports `/items/[id]`. Route parameters and query strings never
reach analytics.

Business events belong to their module. An application operation that needs one
defines a capability-named port in `application/ports/`, and bootstrap adapts the
`AnalyticsTracker` to it. Domain, application and presentation code never import
the tracker or Firebase. The template defines no business events.

## Event rules

Follow the Google Analytics limits; Firebase drops events that break them:

- event names: up to 40 characters, letters, digits and underscores, starting
  with a letter; the `firebase_`, `google_` and `ga_` prefixes are reserved;
- up to 25 parameters per event, parameter names up to 40 characters, string
  values up to 100 characters;
- prefer [recommended events](https://firebase.google.com/docs/analytics/events)
  when one fits.

Parameters are fixed technical identifiers or bounded counts. Never send personal
data, user input, credentials, URLs or response payloads. Google's policies forbid
personally identifiable information in Analytics.

## Privacy

Firebase SDKs ship their own iOS privacy manifests, and Xcode aggregates them
with the app's manifest in `app.json`. Before release, confirm the App Store
privacy labels and the Google Play Data safety form against the data the app
actually collects, as Firebase's
[data disclosure guidance](https://firebase.google.com/docs/ios/app-store-data-collection)
requires.

## Verification

Adapter tests cover the disabled mode, consent mapping with advertising signals
denied, screen and event forwarding, and contained SDK failures. Bootstrap tests
cover selection, debug builds and process lifetime. `toRoutePattern` and the
navigation test cover route-pattern screen names.
`scripts/firebase-config.test.mjs` covers the build selection, file validation,
app config output and autolinking exclusion.

Device delivery needs a real Firebase project:

1. Set `FIREBASE_SERVICES=analytics` and the staging config files in
   `.env.staging.local`, then run `pnpm expo:staging prebuild --clean` and
   `pnpm ios:staging` or `pnpm android:staging`.
2. Enable DebugView: on iOS add `-FIRDebugEnabled` to the scheme's launch
   arguments; on Android run
   `adb shell setprop debug.firebase.analytics.app <package>`.
3. Confirm that no events arrive before `setCollectionConsent(true)`. Then call it
   temporarily, navigate, and confirm `screen_view` events carry route patterns.
   Remove the temporary call.

References: [React Native Firebase Analytics](https://rnfirebase.io/analytics/usage),
[configure data collection](https://firebase.google.com/docs/analytics/configure-data-collection),
[iOS SPM support](https://rnfirebase.io/ios-spm).
