# Shipping Bill Creation Form

An export software frontend for creating, managing, and filing Customs & ICEGATE EDI Shipping Bills. Built on React 19, Tailwind CSS v4, React Hook Form, and Zustand with high-contrast accessibility across both dark and light modes.

## Tech Stack

- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS v4 (with strict custom color tokens & WCAG AA contrast)
- **Forms & Validation**: React Hook Form + Zod
- **State Management**: Zustand
- **Architecture**: `fe-zen-arch` modular workspace architecture

## Quick Start

### 1. Clone with submodules

```bash
git clone --recursive https://github.com/trytotest13/Shipping-Bill-creation-form.git
cd Shipping-Bill-creation-form
```

If already cloned without submodules:

```bash
git submodule update --init --recursive
```

### 2. Install dependencies & run

```bash
pnpm install
pnpm dev
```

The application will launch at `http://localhost:5173`.

### 3. Build & Type Check

```bash
pnpm lint-check   # prettier + tsc + eslint (0 errors)
pnpm build        # Production bundle
```

## Project Documentation

Detailed specifications and architectural documentation are available in the [`docs/`](./docs) folder:

- [Product Requirements Document (PRD)](./docs/prd.md)
- [Technical Requirements Document (TRD)](./docs/trd.md)
- [Architecture & State Flow](./docs/architecture.md)
- [Design Tokens & Theme](./docs/design.md)
- [Schema & Validation](./docs/schema.md)
- [Coding Standards & Rules](./docs/rules.md)

## Architecture at a Glance

```
src/
  dashboard/                  — list screen (thin orchestrator + pure filters + table + stat cards)
  shipping-bills/
    model/                    — domain types, ports, calculations, save-boundary payload (no React)
    schema.ts                 — form validation rules (core/form `s`)
    services/
      api-client.ts           — single HTTP entry point (base URL, headers, error mapping)
      shipping-bill-mapper.ts — typed normalizers for loose backend JSON
      form-options-service.ts — async source of every fixed option list (code lists, currencies...)
      shipping-bill-service.ts— list / upsert / flat-file facade (offline-tolerant)
      party-mock-service.ts   — async party/branch/port lookups
      flat-file.ts, api-seed.ts
    store/                    — demo persistence (seed data + useSyncExternalStore store)
    hooks/                    — form shell, save pipeline, marks & numbers, shared option loader
    components/               — one React component per file (HMR-safe)
      shipping-bill-page.tsx  — slim orchestrator
      details-section / invoices-section / invoice-editor / invoice-item-editor
      cargo-section / documents-section / licenses-section
      party-fields / async-search-select / party-dialog / branch-dialog
      ui/ (section-heading, disclosure, persistent-tab)
  shared/                     — routes, layout, interceptors, small utils
```

Key rules: mock data and service logic never live in UI components; every async path has loading/empty/error handling; no new npm dependencies; all component files export only components (react-refresh/HMR safe).

## AI Usage & Approach

Tools: **ZCode** (agentic coding assistant) used as a pair-programming driver for the mechanical parts of this refactor.

How it was used:

- I first froze an inventory of the monolith (functions, field arrays, schema rules) and wrote a phased plan (`docs/todo.md`) before touching code, so the assistant executed small, reviewable steps (extract schema → hooks → sections → orchestrator → dashboard) with a commit per phase.
- The assistant handled file splitting, import rewiring, and lint-fix sweeps; I reviewed each diff against the behaviour contract (same fields, calculations, validation rules, and payload mappings) before committing.
- Verification was tool-driven, not trust-driven: `pnpm lint-check` (prettier + strict `tsc` + ESLint with `strictTypeChecked`) taken from **159 errors to 0**, `pnpm build` green with the original chunking preserved, and a browser smoke test of the dashboard, new-bill form, and edit routes for both demo-store and API-seeded bills.

My judgment calls (the parts I'd defend in review):

- Kept `fe-zen-arch` untouched and stayed within its APIs (no new dependencies).
- Preserved exact fallback semantics with an explicit `textOr` helper instead of blanket `||` → `??` rewrites, and a NaN-aware `toNumberOr` — lint-clean without changing behaviour.
- Fixed a latent crash found during the refactor (item "unit of rate" placeholder read `invoice.items[invoiceIndex]` instead of the item index) and surfaced async-search failures instead of silently showing "no results".
- Pushed all static option lists (scheme codes, document codes, states, currencies, ports…) behind the async `form-options-service` + shared `useFormOptions` hook so a real API can replace the mock with zero UI changes.

Learnings & validation: the starter's own lint pipeline (bash `fe-zen-arch/scripts/lint.sh`) is the source of truth — it caught prettier drift, strict type issues (`no-unnecessary-condition`, `no-base-to-string`) and naming-convention violations that a plain `tsc` run misses. Every listed fix was verified against that pipeline plus a production build.
