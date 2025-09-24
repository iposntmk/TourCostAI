# Contributing to TourCostAI

Thank you for contributing! This document codifies project conventions so changes remain consistent and easy to maintain.

## Getting Started
- Install deps in the client app:
  ```bash
  cd client
  npm install
  npm run dev
  ```
- Dev server: http://localhost:5173 (auto-opens on start).
- Run checks before committing:
  ```bash
  npm run lint
  npm run build
  npm run preview
  ```

## Project Structure
- All source code lives under `client/`.
- Key paths:
  - `client/src/main.tsx`, `client/src/App.tsx` – App entry and routes
  - `client/src/contexts/` – App state (`MasterDataContext`, `TourContext`)
  - `client/src/pages/` – Feature pages (Dashboard, New Tour, Tour Detail, Master Data)
  - `client/src/utils/` – Core logic (calculations, extraction, formatting, id generation)
  - `client/src/types.ts` – Shared TypeScript contracts
  - `client/src/App.css`, `client/src/index.css` – Styling (CSS variables, responsive)

## Commit and Branching
- Prefer small, focused PRs.
- Conventional commits style (recommended):
  - `feat: add per diem summary to tour detail`
  - `fix: correct export mapping for partner name`
  - `refactor: move price calc into utils`
  - `docs: update TECH_STACK for React upgrade`
  - `chore: bump deps`
- Reference related files in descriptions using backticks, e.g. `client/src/utils/calculations.ts`.

## TypeScript & React Guidelines
- Favor strong typing; avoid `any`. Add/extend interfaces in `client/src/types.ts`.
- Keep components presentational; route business logic via contexts and `utils/`.
- Reuse shared components: `AppLayout`, `PageHeader`, `StatCard`.
- Keep side effects in hooks/providers; avoid duplicating calculations in components.
- Run `npm run lint` and fix warnings/errors before commit.

## Styling
- Use existing CSS tokens and variables (`:root` in `App.css`).
- Mobile-first responsive design (grid/flex). No external CSS frameworks.
- Prefer extending variables over hardcoded colors/sizes.

## Data Model and Persistence
- App state persists in `localStorage` under keys:
  - `tour-cost-ai/master-data`
  - `tour-cost-ai/tours`
- When changing schema:
  1. Update types in `client/src/types.ts`.
  2. Update seed/defaults in `client/src/data/masterData.ts`.
  3. Update forms and pages using the fields (`pages/*`).
  4. Update normalization and calculations (`contexts/TourContext.tsx`, `utils/calculations.ts`).
  5. Consider migration/backward compatibility for persisted data, or clear storage in dev.

## Business Logic Rules
- All financial/per diem math must live in `utils/calculations.ts` and be invoked via `normalizeTour` in `TourContext`.
- Always generate IDs via `utils/ids.ts` (uses `crypto.randomUUID` when available).
- Keep exports (Excel) consistent with data shapes used in Dashboard and Tour Detail.

## AI Extraction Integration
- Current implementation is mocked in `utils/extraction.ts`.
- If integrating a real API, map results back to the existing `ExtractionResult` type and reuse:
  - `matchExtractedServices`
  - `buildTourServices`

## Manual Test Checklist (per PR)
- Create a new tour via New Tour wizard; verify normalization and totals.
- Edit a tour in Tour Detail; validate fields and recalculated summaries.
- Dashboard filters and statistics reflect changes; Excel export downloads and matches expectations.
- Master Data CRUD flows work and persist across reloads.

## Security and Secrets
- Do not commit secrets. Use `.env` and example values in `.env.example`.
- Never hardcode API keys in the repo or client code.

## Code Review Checklist
- Types updated in `types.ts` for any schema change.
- Logic centralized in `utils/` and contexts (no duplication in components).
- CSS uses variables/tokens; UI remains responsive.
- Lint, type-check, and build pass; manual test checklist completed.
- Documentation updated (`PROJECT_STRUCTURE.md`, `TECH_STACK.md`, and this file if needed).

## Release/Build
- Build with `npm run build`; preview with `npm run preview`.
- Static assets output to `client/dist/`.

## Questions
- See `PROJECT_STRUCTURE.md` and `TECH_STACK.md` for architectural notes.
- For UI/UX consistency, refer to existing components and CSS variables.
