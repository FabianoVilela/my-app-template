import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { validateAppVersions } from "./app-versions.cjs";

const SCRIPT = fileURLToPath(new URL("./release-version.mjs", import.meta.url));
const INITIAL = {
  development: { version: "2.0.0", build: 85 },
  staging: { version: "1.3.2", build: 27 },
  production: { version: "1.2.1", build: 12 },
};

function fixture(context) {
  const root = mkdtempSync(join(tmpdir(), "release-version-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  const file = join(root, "app-versions.json");
  writeFileSync(file, `${JSON.stringify(INITIAL, null, 2)}\n`);
  writeFileSync(
    join(root, "package.json"),
    '{"name":"example","version":"9.0.0"}',
  );
  writeFileSync(join(root, "app.json"), '{"expo":{"name":"Example"}}');
  const run = (...args) =>
    spawnSync(process.execPath, [SCRIPT, ...args], {
      cwd: root,
      encoding: "utf8",
    });
  const read = () => JSON.parse(readFileSync(file, "utf8"));
  return { root, file, run, read };
}

for (const [variant, change, version] of [
  ["staging", "patch", "1.3.3"],
  ["staging", "minor", "1.4.0"],
  ["staging", "major", "2.0.0"],
  ["production", "1.3.2", "1.3.2"],
  ["development", "--build-only", "2.0.0"],
]) {
  test(`${variant} ${change} changes only the selected variant and increments its build`, (context) => {
    const { root, run, read } = fixture(context);
    const result = run(variant, change);
    assert.equal(result.status, 0, result.stderr);
    const expected = structuredClone(INITIAL);
    expected[variant] = { version, build: INITIAL[variant].build + 1 };
    assert.deepEqual(read(), expected);
    assert.equal(
      JSON.parse(readFileSync(join(root, "package.json"))).version,
      "9.0.0",
    );
    assert.deepEqual(JSON.parse(readFileSync(join(root, "app.json"))), {
      expo: { name: "Example" },
    });
    assert.equal(
      readdirSync(root).some((file) => file.endsWith(".tmp")),
      false,
    );
  });
}

test("dry-run and help preserve all files", (context) => {
  const { file, run } = fixture(context);
  const before = readFileSync(file, "utf8");
  const preview = run("staging", "minor", "--dry-run");
  assert.equal(preview.status, 0, preview.stderr);
  assert.match(
    preview.stdout,
    /Would update staging: 1.3.2 \(27\) -> 1.4.0 \(28\)/,
  );
  assert.equal(run("--help").status, 0);
  assert.equal(readFileSync(file, "utf8"), before);
});

for (const args of [
  [],
  ["typo", "patch"],
  ["staging"],
  ["staging", "patch", "extra"],
  ["staging", "patch", "--build-only"],
  ["staging", "1.3.2"],
  ["staging", "1.2.9"],
  ["staging", "01.4.0"],
  ["staging", "1.4.0-beta.1"],
  ["staging", "--unknown"],
]) {
  test(`rejects invalid request ${JSON.stringify(args)} without writing`, (context) => {
    const { file, run } = fixture(context);
    const before = readFileSync(file, "utf8");
    assert.equal(run(...args).status, 1);
    assert.equal(readFileSync(file, "utf8"), before);
  });
}

for (const invalid of [
  null,
  [],
  {},
  { ...INITIAL, staging: { version: "bad", build: 1 } },
  ...[0, -1, 1.5, "2", 2100000001].map((build) => ({
    ...INITIAL,
    staging: { version: "1.0.0", build },
  })),
]) {
  test(`rejects invalid version data ${JSON.stringify(invalid)}`, () => {
    assert.throws(() => validateAppVersions(invalid));
  });
}

test("invalid JSON and build overflow fail without changing the file", (context) => {
  const { file, run } = fixture(context);
  for (const content of [
    "{",
    JSON.stringify({
      ...INITIAL,
      staging: { version: "1.0.0", build: 2100000000 },
    }),
  ]) {
    writeFileSync(file, content);
    assert.equal(run("staging", "--build-only").status, 1);
    assert.equal(readFileSync(file, "utf8"), content);
  }
});

test("rejects symlinked data without changing its target", (context) => {
  const { root, file, run } = fixture(context);
  const target = join(root, "target.json");
  copyFileSync(file, target);
  rmSync(file);
  symlinkSync(target, file);
  assert.equal(run("staging", "patch").status, 1);
  assert.deepEqual(JSON.parse(readFileSync(target)), INITIAL);
});

test("Expo config reads independent versions and querying it never increments builds", async (context) => {
  const { root, file, run, read } = fixture(context);
  mkdirSync(join(root, "scripts"));
  copyFileSync(
    new URL("../app.config.ts", import.meta.url),
    join(root, "app.config.ts"),
  );
  copyFileSync(
    new URL("./app-versions.cjs", import.meta.url),
    join(root, "scripts/app-versions.cjs"),
  );
  copyFileSync(
    new URL("./firebase-config.cjs", import.meta.url),
    join(root, "scripts/firebase-config.cjs"),
  );
  const { default: appConfig } = await import(
    pathToFileURL(join(root, "app.config.ts")).href
  );
  const base = JSON.parse(
    readFileSync(new URL("../app.json", import.meta.url)),
  ).expo;
  const previous = process.env.APP_VARIANT;
  context.after(() => {
    if (previous === undefined) delete process.env.APP_VARIANT;
    else process.env.APP_VARIANT = previous;
  });
  for (const variant of Object.keys(INITIAL)) {
    process.env.APP_VARIANT = variant;
    for (let attempt = 0; attempt < 2; attempt++) {
      const config = appConfig({ config: base });
      assert.equal(config.version, INITIAL[variant].version);
      assert.equal(config.ios.buildNumber, String(INITIAL[variant].build));
      assert.equal(config.android.versionCode, INITIAL[variant].build);
    }
  }
  assert.deepEqual(read(), INITIAL);
  assert.equal(run("production", "1.3.2").status, 0);
  assert.equal(appConfig({ config: base }).version, "1.3.2");
  writeFileSync(file, "{}");
  assert.throws(() => appConfig({ config: base }), /version/);
});
