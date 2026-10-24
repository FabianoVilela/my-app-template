/// <reference types="node" />

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
import { dirname, join } from "node:path";
import type { TestContext } from "node:test";
import { test } from "node:test";
import { fileURLToPath, URL } from "node:url";

const SCRIPT = fileURLToPath(new URL("./rename-app.ts", import.meta.url));
const PROJECT_PACKAGE = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

function fixture(context: TestContext) {
  const root = mkdtempSync(join(tmpdir(), "rename-app-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  const files: Record<string, string> = {
    "app.json": JSON.stringify({
      expo: {
        name: "Starter App",
        slug: "starter-app",
        scheme: "starterapp",
        ios: {
          bundleIdentifier: "com.example.starterapp",
          infoPlist: { CFBundleDisplayName: "Starter App" },
        },
        android: { package: "org.company.starterapp" },
        extra: { eas: { projectId: "preserve-project-id" } },
        updates: { url: "https://u.expo.dev/preserve-project-id" },
      },
    }),
    "package.json": JSON.stringify({
      name: "starter-app",
      private: true,
      main: "expo-router/entry",
      dependencies: { expo: "~58.0.14" },
      scripts: { "rename-app": PROJECT_PACKAGE.scripts["rename-app"] },
    }),
    "scripts/package.json": '{"private":true,"type":"module"}\n',
    "README.md":
      "Starter App / starter-app / starterapp://home / com.example.starterapp / org.company.starterapp / starter-app-extra\n",
    "src/config.json":
      '{"starter-app":"Starter App","url":"starterapp://home"}\n',
    "src/escaped.json": '{"accent":"\\u00e9","slash":"\\/"}\n',
    ".env.example": "EXPO_PUBLIC_APP_URL=starterapp://home\n",
    ".vscode/settings.json": '{"title":"Starter App"}\n',
    "node_modules/vendor/ignored.json": '{"name":"starter-app"}\n',
    "ios/Info.plist": "Starter App",
    "android/strings.xml": "Starter App",
    "assets/binary.json": "starter-app\0",
    ".env": "SECRET=starter-app\n",
    "pnpm-lock.yaml": "lockfileVersion: '9.0'\n",
  };
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  copyFileSync(SCRIPT, join(root, "scripts/rename-app.ts"));
  const run = (args: string[], preload?: string) =>
    spawnSync(
      process.execPath,
      [
        "--experimental-strip-types",
        ...(preload ? ["--import", preload] : []),
        SCRIPT,
        ...args,
      ],
      { cwd: root, encoding: "utf8" },
    );
  const read = (path: string) => readFileSync(join(root, path), "utf8");
  const runNpm = (args: string[]) =>
    spawnSync("npm", ["run", "rename-app", ...args], {
      cwd: root,
      encoding: "utf8",
      timeout: 10000,
    });
  return { root, files, run, runNpm, read };
}

test("renames configuration and references while preserving unrelated files", (context) => {
  const { run, read, files } = fixture(context);
  const result = run(["Minha Aplicação"]);
  assert.equal(result.status, 0, result.stderr);
  const { expo } = JSON.parse(read("app.json"));
  assert.equal(expo.name, "Minha Aplicação");
  assert.equal(expo.slug, "minha-aplicacao");
  assert.equal(expo.scheme, "minhaaplicacao");
  assert.equal(expo.ios.bundleIdentifier, "com.example.minhaaplicacao");
  assert.equal(expo.android.package, "org.company.minhaaplicacao");
  assert.equal(expo.ios.infoPlist.CFBundleDisplayName, "Minha Aplicação");
  assert.equal(expo.extra.eas.projectId, "preserve-project-id");
  assert.equal(expo.updates.url, "https://u.expo.dev/preserve-project-id");
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.name, "minha-aplicacao");
  assert.equal(pkg.main, "expo-router/entry");
  assert.deepEqual(pkg.dependencies, { expo: "~58.0.14" });
  assert.match(read("README.md"), /Minha Aplicação \/ minha-aplicacao/);
  assert.match(read("README.md"), /minhaaplicacao:\/\/home/);
  assert.match(read("README.md"), /starter-app-extra/);
  assert.deepEqual(JSON.parse(read("src/config.json")), {
    "starter-app": "Minha Aplicação",
    url: "minhaaplicacao://home",
  });
  assert.match(read(".env.example"), /minhaaplicacao:\/\/home/);
  assert.match(read(".vscode/settings.json"), /Minha Aplicação/);
  for (const path of [
    "node_modules/vendor/ignored.json",
    "ios/Info.plist",
    "android/strings.xml",
    "assets/binary.json",
    ".env",
    "pnpm-lock.yaml",
    "src/escaped.json",
  ]) {
    assert.equal(read(path), files[path], path);
  }
  assert.match(result.stderr, /pnpm expo prebuild --clean/);
});

test("dry run and help do not write any files", (context) => {
  const { run, read, files } = fixture(context);
  assert.equal(run(["Meu App", "--dry-run"]).status, 0);
  assert.equal(run(["--help"]).status, 0);
  for (const [path, content] of Object.entries(files)) {
    assert.equal(read(path), content, path);
  }
});

for (const args of [
  ["My App", "--dry-run"],
  [
    "My App",
    "--ios-bundle-id",
    "com.myapp",
    "--android-package",
    "com.myapp",
    "--dry-run",
  ],
  [
    "My App",
    "--ios-bundle-id=com.myapp",
    "--android-package=com.myapp",
    "--dry-run",
  ],
  ["My App", "--slug=myapp-mobile"],
  ["My App", "--scheme=myapp"],
]) {
  test(`rejects options consumed by npm before writing: ${args.join(" ")}`, (context) => {
    const { runNpm, read, files } = fixture(context);
    const result = runNpm(args);
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /npm run rename-app --/);
    assert.match(result.stderr, /No files were changed/);
    for (const [path, content] of Object.entries(files)) {
      assert.equal(read(path), content, path);
    }
  });
}

for (const options of [
  [],
  ["--ios-bundle-id", "com.myapp", "--android-package", "com.myapp"],
  [
    "--slug",
    "myapp-mobile",
    "--scheme",
    "myapp",
    "--ios-bundle-id=com.myapp",
    "--android-package=com.myapp",
  ],
]) {
  test(`npm forwards preview options after the separator: ${options.join(" ")}`, (context) => {
    const { runNpm, read, files } = fixture(context);
    const result = runNpm(["--", "My App", ...options, "--dry-run"]);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /"name": "My App"/);
    assert.match(result.stdout, /Would update/);
    assert.match(result.stdout, /app\.json/);
    assert.match(result.stdout, /package\.json/);
    if (options.length > 0) {
      assert.match(result.stdout, /"iosId": "com\.myapp"/);
      assert.match(result.stdout, /"androidId": "com\.myapp"/);
    }
    if (options.includes("--slug")) {
      assert.match(result.stdout, /"slug": "myapp-mobile"/);
      assert.match(result.stdout, /"scheme": "myapp"/);
    }
    for (const [path, content] of Object.entries(files)) {
      assert.equal(read(path), content, path);
    }
  });
}

test("npm applies explicitly forwarded identifiers without dry-run", (context) => {
  const { runNpm, read } = fixture(context);
  const result = runNpm([
    "--",
    "My App",
    "--ios-bundle-id",
    "com.myapp",
    "--android-package",
    "com.myapp",
  ]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Updated/);
  const { expo } = JSON.parse(read("app.json"));
  assert.equal(expo.name, "My App");
  assert.equal(expo.slug, "my-app");
  assert.equal(expo.ios.bundleIdentifier, "com.myapp");
  assert.equal(expo.android.package, "com.myapp");
  assert.equal(JSON.parse(read("package.json")).name, "my-app");
});

test("supports consecutive renames without confusing a slug with a link scheme", (context) => {
  const { run, read } = fixture(context);
  assert.equal(run(["Alpha"]).status, 0);
  const result = run(["Beta Mobile"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(
    read("README.md"),
    /Beta Mobile \/ beta-mobile \/ betamobile:\/\/home/,
  );
  assert.equal(JSON.parse(read("package.json")).name, "beta-mobile");
  assert.match(read("app.json"), /com.example.betamobile/);
  const unchanged = run(["Beta Mobile"]);
  assert.equal(unchanged.status, 0, unchanged.stderr);
  assert.match(unchanged.stdout, /Updated 0 file/);
});

test("supports explicit identifiers, non-Latin names and scoped package names", (context) => {
  const { root, run, read } = fixture(context);
  const pkg = JSON.parse(read("package.json"));
  pkg.name = "@company/starter-app";
  writeFileSync(join(root, "package.json"), JSON.stringify(pkg));
  const result = run([
    "应用",
    "--slug",
    "my-app",
    "--scheme",
    "my-app+test",
    "--ios-bundle-id",
    "com.other.my-app",
    "--android-package",
    "com.other.my_app",
  ]);
  assert.equal(result.status, 0, result.stderr);
  const { expo } = JSON.parse(read("app.json"));
  assert.equal(expo.name, "应用");
  assert.equal(expo.scheme, "my-app+test");
  assert.equal(expo.ios.bundleIdentifier, "com.other.my-app");
  assert.equal(expo.android.package, "com.other.my_app");
  assert.equal(JSON.parse(read("package.json")).name, "@company/my-app");
});

test("keeps native display-name overrides consistent when the old display name equals the slug", (context) => {
  const { root, run, read } = fixture(context);
  const config = JSON.parse(read("app.json"));
  config.expo.name = "starter-app";
  config.expo.ios.infoPlist.CFBundleDisplayName = "starter-app";
  writeFileSync(join(root, "app.json"), JSON.stringify(config));
  const result = run(["My App"]);
  assert.equal(result.status, 0, result.stderr);
  const { expo } = JSON.parse(read("app.json"));
  assert.equal(expo.ios.infoPlist.CFBundleDisplayName, "My App");
});

for (const name of ["123 App", "Class"]) {
  test(`generates valid native identifiers for ${name}`, (context) => {
    const { run, read } = fixture(context);
    const result = run([name]);
    assert.equal(result.status, 0, result.stderr);
    const { expo } = JSON.parse(read("app.json"));
    assert.match(expo.scheme, /^app[a-z0-9]+$/);
    assert.match(expo.android.package, /^org\.company\.app[a-z0-9]+$/);
  });
}

for (const args of [
  [],
  [""],
  ["   "],
  ["One", "Two"],
  ["Bad\nName"],
  ["应用"],
  ["App", "--slug", "Bad_Slug"],
  ["App", "--slug", "a".repeat(101)],
  ["App", "--scheme", "1invalid"],
  ["App", "--android-package", "com.123"],
  ["App", "--ios-bundle-id", "com.bad_id"],
  ["App", "--unknown"],
]) {
  test(`rejects invalid arguments ${JSON.stringify(args)} before writing`, (context) => {
    const { run, read, files } = fixture(context);
    const result = run(args);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /rename-app:/);
    assert.equal(read("app.json"), files["app.json"]);
    assert.equal(read("package.json"), files["package.json"]);
  });
}

for (const extension of ["js", "ts", "mjs", "cjs", "mts", "cts", "json"]) {
  test(`rejects app.config.${extension} before writing`, (context) => {
    const { root, run, read, files } = fixture(context);
    writeFileSync(join(root, `app.config.${extension}`), "{}");
    const result = run(["New App"]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /can override app.json/);
    assert.equal(read("app.json"), files["app.json"]);
  });
}

test("rejects malformed JSON, missing config and symlinked config", (context) => {
  const { root, run, read, files } = fixture(context);
  writeFileSync(join(root, "app.json"), "{");
  assert.match(run(["New App"]).stderr, /Invalid JSON/);
  rmSync(join(root, "app.json"));
  assert.match(run(["New App"]).stderr, /ENOENT/);
  symlinkSync(join(root, "package.json"), join(root, "app.json"));
  assert.match(run(["New App"]).stderr, /without symlinks/);
  assert.equal(read("package.json"), files["package.json"]);
});

test("restores committed files and removes temporary files after a write failure", (context) => {
  const { root, run, read, files } = fixture(context);
  const preload = join(root, "fail-commit.mjs");
  writeFileSync(
    preload,
    `
    import fs from 'node:fs/promises';
    import { syncBuiltinESMExports } from 'node:module';
    const originalRename = fs.rename;
    let count = 0;
    fs.rename = async (...args) => {
      if (++count === 2) throw new Error('Simulated disk failure');
      return originalRename(...args);
    };
    syncBuiltinESMExports();
  `,
  );
  const result = run(["New App"], preload);
  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /Simulated disk failure.*Original files restored/,
  );
  for (const [path, content] of Object.entries(files)) {
    assert.equal(read(path), content, path);
  }
  assert.equal(
    readdirSync(root, { recursive: true }).some((path) =>
      String(path).endsWith(".rename-tmp"),
    ),
    false,
  );
});
