# Architecture — Shipping Bill Zen Refactor

## 1. Before vs After Directory Tree

Before (monolith):

```
src/
  dashboard/list-dashboard.tsx
  data/e-sanchit-codes.ts, quantity-code.ts, scheme-codes.ts, states.ts, trade-agrements.ts, types.ts
  shared/routes.tsx, route-paths.ts, application-layout.tsx, interceptors.ts
  shipping-bills/shipping-bill-form.tsx (~75KB monolith: UI + state + dialogs + save pipeline)
  shipping-bills/model.ts, demo-store.ts (seed + store), shipping-bill-service.ts (HTTP + mapper + flat file + seed), party-mock-service.ts, party-dialogs.tsx, marks-and-numbers-source.ts, workflow.ts
fe-zen-arch/ (submodule: core/*, ui/*, icons/*, auth/*, scripts/lint.sh)
```

After (strict separation, no new deps):

```
src/
  dashboard/
    list-dashboard.tsx (thin orchestrator: state + handlers + layout)
    bill-filters.ts (pure search/sort/unique helpers)
    bills-table.tsx (table + row, per-row download state via props)
    stat-cards.tsx (summary cards)
  data/ (static codes; trade-agrements.ts renamed trade-agreements.ts)
  shared/ (routes, route-paths, application-layout, interceptors, errors.ts, format.ts)
  shipping-bills/
    model/            — domain, zero React
      party.ts        — Branch/Exporter/Business
      port.ts         — ports, countries, portCountry()
      bill.ts         — form value types + empty* factories + lineTotal/invoiceTotal
      payload.ts      — toShippingBillPayload (save-boundary derivation)
      saved-bill.ts   — SavedBill
      index.ts        — barrel
    schema.ts         — billSchema + positive (core/form `s`)
    input-date-type.ts — the single ui/inputs date-type workaround
    workflow.ts       — workflowSteps
    hooks/
      use-shipping-bill-form.ts (useForm shell + activeTab/draftId + error-tab routing)
      use-save-shipping-bill.ts (save pipeline: local save → best-effort API sync → toast → navigate)
      use-marks-and-numbers.ts (cancellable fetch by exporterId)
      use-form-options.ts (one shared cached load of all fixed option lists)
    services/
      api-client.ts             — BASE_URL, headers, apiRequest()
      shipping-bill-mapper.ts   — toHttpShippingBillPayload + normalizeApiBill(s) (typed parsers, unknown-safe)
      flat-file.ts              — ICEGATE .sb generator + blob download helpers
      api-seed.ts               — API-shaped seed rows for offline fallback
      shipping-bill-service.ts  — thin facade (list/getById/upsert/getFlatFile/downloadFlatFile)
      form-options-service.ts   — async source of every fixed option list (no component imports hardcoded arrays)
      party-mock-service.ts     — async party/port lookups over demo-store
      marks-and-numbers-source.ts
    store/
      demo-seed.ts  — seed masters + one bill (pure data)
      demo-store.ts — useSyncExternalStore snapshot + save/delete mutations with in-use guards
    components/
      shipping-bill-page.tsx   — route entry (page + not-found)
      bill-editor.tsx→ merged into shipping-bill-page.tsx (orchestrator: form shell, quick-add state, save hook)
      bill-form-header.tsx, bill-form-footer.tsx, workflow-stepper.tsx
      details-section.tsx      — tab 1 (parties, route, regulatory, package detail)
      invoices-section.tsx     — owns invoices field array
      invoice-editor.tsx       — one invoice card
      invoice-item-editor.tsx  — one goods line (customs/AR4 disclosures)
      invoice-charges.tsx      — rate/amount/currency rows reused 6× (freight/insurance/commission/discount/otherDeductions/packing)
      cargo-section.tsx        — containers + packing ranges (tab 3a)
      documents-section.tsx    — supporting docs + reusable issuing/beneficiary address fields (tab 3b)
      licenses-section.tsx     — licences (tab 3c)
      party-fields.tsx         — paired party+branch pickers (branch list depends on party)
      async-search-select.tsx  — generic debounced async search select (loading/empty/error states)
      party-dialog.tsx, branch-dialog.tsx — quick-add dialogs
      ui/section-heading.tsx, ui/disclosure.tsx, ui/persistent-tab.tsx
```

## 2. Layering Rules

- `model/`, `schema.ts`, `store/`, `services/`, `data/` — no React components; pure types, derivations and I/O.
- `components/` — only React component exports (react-refresh/HMR rule enforced by eslint).
- Components never import fetch/localStorage directly; they call hooks and services. Section components own their `useFieldArray` so the orchestrator stays small and sections are independently reusable.
- `AsyncSearchSelect`/`PartyFields`/`Disclosure` etc. are generic — they take paths and callbacks, not bill-specific knowledge.

## 3. Data Flow

```
User input (ui/inputs)
 -> RHF control (core/form useForm + schema.ts validation)
 -> section components (scoped watch; own field arrays)
 -> model/payload.ts toShippingBillPayload + model/bill.ts lineTotal/invoiceTotal (derived display)
 -> hooks/use-save-shipping-bill:
      store/demo-store.saveBill (localStorage v2, offline-safe)
      -> services/shipping-bill-service.upsert (POST /api/shipping-bills, try/catch tolerated)
      -> toast + navigate to edit route
Dashboard: services.list() -> normalizeApiBills | seed -> bill-filters (pure) -> table
Flat file: services.downloadFlatFile -> GET blob/JSON (filename from content-disposition) else flat-file.ts generator
Masters: demo-store snapshot -> selects; quick-add dialogs -> saveParty/saveBranch -> publish -> re-render
```

## 4. Rendering Strategy

- Client-only SPA (Vite). Routes via `core/routing`: dashboard eager, shipping-bill page lazy-imported from `components/shipping-bill-page`.
- HMR: every component file exports only components; option data lives in `services/form-options-service.ts`; types are type-only exports.
- `PersistentTab` keeps all tabs mounted (hidden) so submit validates the entire bill; section components render inside their panel.
- Build chunking preserved: `manualChunks` (v/react, v/form, v/fetch, v/popover, v/err-obs); the page is its own lazy chunk.

## 5. Third-Party Service Boundaries

- `fe-zen-arch` = internal platform (core/ui/icons) — aliased via tsconfig paths + vite alias; no new npm deps.
- Backend `PUBLIC_API_URL` accessed ONLY via `services/api-client.ts`; header/auth/currency/date transforms isolated in the mapper.
- Loose backend JSON is normalized at the boundary (`unknown` in, typed values out) so components never see `any`.
- localStorage is the mock persistence boundary inside `store/demo-store` only.
