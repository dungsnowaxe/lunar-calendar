# AGENTS.md

Guidance for coding agents working in this repository.

## Project layout

pnpm monorepo — run commands from the repo root.

- `apps/web` — React 19 + TanStack Start + Tailwind CSS v4, deployed to Cloudflare Workers.
- `packages/lunar` (`@lunar/core`) — lunar calendar core library.
- `apps/web/src/routeTree.gen.ts` is generated — never edit it (ignored by oxlint/oxfmt).

## Commands

- `pnpm typecheck` — TypeScript across all packages
- `pnpm test` — unit tests
- `pnpm lint` — oxlint (`pnpm lint:fix` to auto-fix)
- `pnpm fmt` — oxfmt (`pnpm fmt:check` to verify without writing)

## Linting and formatting

- After making code changes, run `pnpm exec oxlint --fix`, then run `pnpm exec oxfmt`.
- Before finishing, run `pnpm exec oxlint --deny-warnings --format=agent`.
- A pre-commit hook runs lint-staged (oxlint + oxfmt) on staged files.

Configuration lives in `.oxlintrc.json` and `.oxfmtrc.json`.
