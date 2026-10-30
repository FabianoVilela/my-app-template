# Agent instructions

## Project and scope

This repository is an Expo/React Native reference template using TypeScript, Expo Router, and pnpm. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

- These instructions apply to the whole repository.
- For application changes under `src/`, read and follow [Application architecture](docs/architecture/AGENTS.md) for responsibilities and dependency boundaries. This reference explicitly applies those rules throughout `src/`.
- When creating, renaming, moving or editing project files, follow [Project conventions](docs/conventions/AGENTS.md) for naming, organization and style. This reference explicitly applies those conventions throughout the repository, subject to their documented exceptions.
- Read any additional `AGENTS.md` files along the path to files being changed. More specific instructions take precedence within their scope.
- Keep this file focused on repository-wide workflow, architecture rules in `docs/architecture/AGENTS.md`, and naming, organization and code-style conventions in `docs/conventions/AGENTS.md`. Reference the owning document instead of duplicating its rules.
- Preserve unrelated changes and existing behavior. The numbered modules are template placeholders; do not invent business features to populate them.

## Documentation lookup

- For library, framework, SDK, API, CLI, and cloud-service questions, fetch current documentation with Context7 rather than relying on memory. This is not required for general programming concepts, business-logic debugging, or code review without library-specific questions.
- Use `pnpm dlx ctx7@latest library <official-name> "<specific-question>"` first, then `pnpm dlx ctx7@latest docs <returned-library-id> "<specific-question>"`. Resolve first unless the user supplies a library ID. Use at most three Context7 commands per question.
- Run documentation lookups with the access available in the current environment. Request additional access only when the host requires and supports it. Do not send credentials or private data in queries.
- On a quota error, report it and suggest `pnpm dlx ctx7@latest login` or `CONTEXT7_API_KEY`; do not silently substitute remembered API details.
- Use the Expo MCP for relevant Expo documentation and diagnostics when available. If it is unavailable, report the limitation and consult official documentation directly.

- Before changing Expo or React Native APIs, read the `expo` major version in `package.json` and consult the matching SDK documentation at `https://docs.expo.dev/versions/v<major>.0.0/`. For topics outside that SDK reference, use [Expo's documentation index](https://docs.expo.dev/llms.txt) to find the relevant official page. Reuse documentation already fetched for the same version and task.

## Commands

Run commands from the repository root and use pnpm, matching `pnpm-lock.yaml`. RTK is optional and is not a project dependency: use it to run shell commands when the `rtk` executable is available on `PATH`; otherwise run the commands directly. Use `rtk proxy <command>` for commands without a dedicated wrapper when RTK is available.

```bash
pnpm install                 # install existing dependencies
pnpm start                   # start the Expo dev server
pnpm lint                    # lint using the existing Biome configuration
pnpm check                   # lint, formatting and import organization
pnpm check:staged            # check staged files through lint-staged
pnpm check:push              # types, application tests and rename script tests
pnpm commitlint              # validate a commit message from stdin
pnpm typecheck               # TypeScript, no emit
pnpm format:check            # check formatting
pnpm test                    # unit, HTTP integration and native component tests
pnpm test:watch              # watch application tests
pnpm test:coverage           # application tests with coverage reports
pnpm test:ci                 # application tests in CI with coverage
pnpm test:rename-app         # rename script integration tests (Node.js runner)
pnpm expo install <package>  # install SDK-compatible dependencies
pnpm expo install --fix      # fix incompatible versions when relevant
```

- Always use `pnpm expo install <package>` when adding dependencies so Expo can resolve SDK-compatible versions.
- Run `pnpm lint`, `pnpm check` and `pnpm typecheck` before declaring a task done. CI should run at least `pnpm check` and `pnpm typecheck`. Report failures or checks that could not run.
- Biome is already configured. Use the package scripts instead of introducing another linter with `expo lint`.
- Before adding or changing tests, follow the [testing guide](docs/testing.md) for environments, installed-version guidance, HTTP mocking and commands. Add meaningful tests when implementing behavior.

## Local Git workflow

- `pre-commit` checks staged files with Biome through lint-staged, without changing files. Fix failures explicitly and stage the intended changes again.
- `commit-msg` validates Conventional Commits using `commitlint.config.cjs`. Read the resolved rules with `pnpm commitlint --print-config json` before writing a message when needed. Follow the [commit conventions](docs/conventions/AGENTS.md#commit-messages).
- `pre-push` runs `pnpm check:push`, including TypeScript, application tests and the rename script tests. A failing command stops the push.
- Fix rejected checks and retry. Do not bypass hooks with `--no-verify`, `HUSKY=0` or equivalent settings unless explicitly instructed by the user.
- See the [Git workflow guide](docs/git-workflow.md) for setup, partial staging and troubleshooting. CI/CD and remote merge policies are not configured by this workflow.

## Rules

- This template uses generated, Git-ignored `ios/` and `android/` directories (Continuous Native Generation). Configure native behavior in `app.json` and config plugins; do not create or edit generated native files by hand, even when local builds have created those directories.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build. Use `pnpm ios` or `pnpm android` when a local build is requested.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Change verification

- Keep changes limited to the requested task. Update the architecture or conventions instructions when intentionally changing the rules they own.
- Check `git diff --check` and inspect the final diff.
- Summarize the changed paths, validation results, and material limitations. Create commits, builds, or deployments only when requested.
- Instruction-file format and scope reference: [AGENTS.md](https://agents.md/).
