# AGENTS

## Current State

- This repo is an early scaffold for a Node-first TypeScript library. `README.md` is empty; the real project contract lives in `SPEC.md`, with rollout details in `IMPLEMENTATION.md` and architecture intent in `DESIGN.md`.
- The exported public surface is defined in `src/index.ts`. Keep new public APIs wired through that file.
- Current implementations in `src/render/*`, `src/schema/validate.ts`, `src/normalize`, and `src/assets` are placeholders. Preserve the agreed API shape while filling them in.

## Commands

- Install deps: `npm install`
- Full verification in the repo's required order: `npm run check`
- Individual steps:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`
- Install the Playwright browser once per machine: `npm run playwright:install`
- Run a single Vitest file: `npx vitest run test/schema.test.ts`
- Run Playwright visual tests: `npx playwright test`

## Tooling Facts That Are Easy To Miss

- Runtime target is Node `>=20`.
- The package is ESM (`"type": "module"`) and TypeScript uses `module/moduleResolution: "NodeNext"` with `verbatimModuleSyntax: true`.
- In local TypeScript imports, use `.js` file extensions in import paths, not `.ts`.
- `npm run build` uses `tsconfig.build.json` and only builds `src/**/*.ts` into `dist/`.
- `npm run test` only runs Vitest files matching `test/**/*.test.ts`.
- Playwright tests live under `test/visual`, use Chromium headless, and are not part of `npm run check`.

## Code Style Constraints From Config

- ESLint enforces `interface` for object-shaped TypeScript declarations via `@typescript-eslint/consistent-type-definitions`.
- Prefix intentionally unused variables/args with `_` to satisfy lint rules.
- Prettier is the formatter of record; use `npm run format` or `npm run format:check`.

## Repo Structure

- `src/schema`: public document types and validation
- `src/normalize`: normalization pipeline target
- `src/render/html`: canonical renderer
- `src/render/image`: image renderer derived from HTML output
- `src/theme` and `src/presets`: built-in themes and theme helpers
- `src/assets`: remote asset handling
- `examples`: usage snippets, not part of the build
- `test`: Vitest tests and Playwright visual tests

## Implementation Guardrails

- Follow `SPEC.md` over ad hoc design changes. If code and prose diverge, trust the executable config plus the exported API surface, then update docs.
- Keep HTML as the source of truth for rendering. Do not introduce a separate image layout path.
- The project is single-package, not a monorepo. Do not add package boundaries unless the repo structure changes first.
