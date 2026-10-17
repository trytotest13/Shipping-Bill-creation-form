# Implementation Roadmap — Zen Refactor (no new deps, docs are truth)

## Phase 1: Project Setup & Tooling

- [ ] T1.1 Git init + .gitignore + .env.example + git status verify (AC: no .env tracked, initial commit)
- [ ] T1.2 Clone starter + `git submodule update --init` for fe-zen-arch, `pnpm install`, `pnpm dev` boots 5173, `pnpm lint-check` baseline (AC: dev renders dashboard, lint log saved)
- [ ] T1.3 Freeze inventory: list src/* line counts + billSchema field count (AC: inventory table in todo.md)

## Phase 2: Database (mock store), Auth & API Layer

- [ ] T2.1 Move `demo-store.ts` → `store/demo-store.ts` unchanged, add `useDemoData` doc + storageKey guard (AC: dashboard still lists, no import break)
- [ ] T2.2 Move `shipping-bill-service.ts` → `services/shipping-bill-service.ts`, extract `toHttpShippingBillPayload` pure + unit-check via console (AC: upsert payload byte-identical)
- [ ] T2.3 Move `party-mock-service.ts`, `marks-and-numbers-source.ts` → `services/` (AC: quick-add + marks options still work)
- [ ] T2.4 Verify interceptors + auth routes untouched (AC: no auth regression)

## Phase 3: Core Features (pure split, no behavior change)

- [ ] T3.1 Extract `schema.ts` from form (billSchema + positive) (AC: validation errors identical)
- [ ] T3.2 Extract `hooks/use-shipping-bill-form.ts` + `hooks/use-marks-and-numbers.ts` (AC: tab-switch on error identical)
- [ ] T3.3 Extract `components/bill-header-section.tsx` (AC: branch filtering + port validation identical)
- [ ] T3.4 Extract `components/invoice-section.tsx` + `invoice-item-rows.tsx` with invoiceTotal/lineTotal (AC: totals match)
- [ ] T3.5 Extract `containers/packing/documents/licenses` sections (AC: FieldArray add/remove identical)
- [ ] T3.6 Extract `party-dialogs.tsx` + `workflow-stepper.tsx`, slim `shipping-bill-form.tsx` orchestrator <400 lines, HMR-only export (AC: file passes HMR rule + lint)
- [ ] T3.7 Dashboard thin pass: keep UI, route via services only (AC: search/sort/flat-file identical)

## Phase 4: Polish, A11y, Error States, Deployment

- [ ] T4.1 Loading/empty/error states audit for list/upsert/flat-file/marks (AC: offline demo video/screenshot, toasts verified)
- [ ] T4.2 A11y pass: labels, aria-describedby, focus on error tab, keyboard Tabs/Dialog (AC: manual checklist)
- [ ] T4.3 Design token compliance check vs design.md (AC: no new hex/classes, prettier tailwind order)
- [ ] T4.4 `pnpm lint-check` + `pnpm build` green, secret scan (`git status` + grep for keys), phase report (AC: build output + lint log attached)
