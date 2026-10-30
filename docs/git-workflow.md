# Local Git workflow

The template uses Husky, lint-staged and commitlint for local feedback. It keeps
Biome as the existing formatter/linter and uses the existing TypeScript and test
commands. No CI/CD workflow, release automation or remote merge policy is set up.

## Setup

Run `pnpm install` after cloning. The `prepare` script installs Husky and sets
Git's local `core.hooksPath` to `.husky/_`. To reinstall hooks in an existing
checkout, run `pnpm prepare`. Keep `.husky/pre-commit`, `.husky/commit-msg` and
`.husky/pre-push` versioned; Husky generates and ignores `.husky/_`.

Node.js and pnpm must be available wherever Git runs, including Git GUIs. Keep
hook files in POSIX shell syntax. No global installation of these tools is needed.

## Checks

Hook commands and required behavior are defined in the root
[Local Git workflow](../AGENTS.md#local-git-workflow).

Checks do not apply automatic fixes. Use `pnpm check:fix` explicitly when needed,
review its changes and stage only the intended content. Files outside Biome's
configured scope are skipped. A commit containing only such files can proceed.

lint-staged temporarily hides unstaged changes in partially staged files so the
check sees their staged content, and restores those changes afterward. Avoid
editing the same files while the hook runs. Its default backup/recovery behavior
is preserved; do not disable stashing or partial-change hiding.

TypeScript and tests run against the working tree, including unstaged changes,
and do not validate an isolated snapshot of each outgoing commit. Tests run
without coverage before pushing; `pnpm test:coverage` remains available when
needed. Run `pnpm check` for a complete Biome check before merging, including
after changing shared configuration. Local hooks can be bypassed and do not
provide remote enforcement.

## Commit messages

Follow the [project commit conventions](conventions/AGENTS.md#commit-messages).

Inspect the effective rules or validate a candidate before committing:

```bash
pnpm commitlint --print-config json
printf '%s\n' 'chore(tooling): configure local git hooks' | pnpm commitlint
```

Humans and agents use the same validator. No interactive commit assistant is
installed. Validation checks message structure; review the staged diff to confirm
that the message describes the change accurately. Existing commits are not
rewritten or retroactively validated by the local hooks.

## Troubleshooting

- If hooks do not execute, run `pnpm prepare` and inspect
  `git config --get core.hooksPath`; the expected value is `.husky/_`.
- If a Git GUI cannot find Node.js or pnpm, configure the version manager/PATH in
  `~/.config/husky/init.sh`, following the Husky guide below. Keep machine-specific
  paths outside the repository.
- If validation fails, fix the reported problem and retry. Use
  `pnpm check:staged` or `pnpm check:push` to reproduce the checks manually.
- In a downloaded source archive without `.git`, hooks cannot be installed. Run
  `pnpm prepare` after initializing a Git repository.

## References

- [Husky setup and troubleshooting](https://typicode.github.io/husky/how-to.html)
- [Biome Git hooks](https://biomejs.dev/recipes/git-hooks/)
- [lint-staged](https://github.com/lint-staged/lint-staged)
- [commitlint local setup](https://commitlint.js.org/guides/local-setup.html)
- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
