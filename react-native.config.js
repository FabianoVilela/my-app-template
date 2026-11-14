const {
  readFirebaseConfig,
  unlinkedFirebasePackages,
} = require("./scripts/firebase-config.cjs");

// Firebase native SDKs (and the dynamic frameworks they require on iOS) are
// linked only when FIREBASE_SERVICES selects them for the current build.
const dependencies = Object.fromEntries(
  unlinkedFirebasePackages(readFirebaseConfig()).map((name) => [
    name,
    { platforms: { ios: null, android: null } },
  ]),
);

module.exports = { dependencies };
