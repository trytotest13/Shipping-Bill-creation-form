# Architecture — Shipping Bill Zen Refactor

## 1. Current vs Target Directory Tree
Current (monolith):
```
src/
  dashboard/list-dashboard.tsx
  data/e-sanchit-codes.ts, quantity-code.ts, scheme-codes.ts, states.ts, trade-agrements.ts, types.ts
  shared/routes.tsx, route-paths.ts, application-layout.tsx, interceptors.ts
  shipping-bills/shipping-bill-form.tsx (75KB monolith)
  shipping-bills/model.ts, demo-store.ts, shipping-bill-service.ts, party-mock-service.ts, party-dialogs.tsx, marks-and-numbers-source.ts, workflow.ts
fe-zen-arch/ (submodule: core/*, ui/*, icons/*, auth/*, scripts/lint.sh)
```

Target (strict separation, no new deps):
```
src/
  dashboard/list-dashboard.tsx (thin, uses hooks/services)
  data/ (unchanged static codes)
  shared/routes.tsx, route-paths.ts, application-layout.tsx, interceptors.ts
  shipping-bills/
    shipping-bill-form.tsx (orchestrator <400 lines, HMR-only export)
    schema.ts (billSchema + positive + leaf-name rules, from core/form s)
    model.ts (types + emptyBill/emptyInvoice/emptyItem/emptyDocument + invoiceTotal/lineTotal/portCountry + toShippingBillPayload)
    services/shipping-bill-service.ts (BASE_URL, toHttpShippingBillPayload, list/upsert/getFlatFile/downloadFlatFile + generateFlatFileContent)
    services/party-mock-service.ts (partyMockService)
    services/marks-and-numbers-source.ts (getMarksAndNumbersOptions)
    store/demo-store.ts (useSyncExternalStore snapshot, seed, saveBill, saveParty/Branch, delete guards, useDemoData/getDemoData)
    hooks/use-shipping-bill-form.ts (useForm setup + useFieldArrays + activeTab + draftId + error-tab routing)
    hooks/use-marks-and-numbers.ts (cancellable fetch by exporterId)
    components/bill-header-section.tsx (job/exporter/consignee/ports/weights)
    components/invoice-section.tsx (invoices FieldArray wrapper)
    components/invoice-item-rows.tsx (nested items + totals)
    components/containers-section.tsx, packing-section.tsx, documents-section.tsx, licenses-section.tsx
    components/party-dialogs.tsx (PartyDialog + BranchDialog, quickAdd)
    components/workflow-stepper.tsx (workflowSteps render)
    workflow.ts (steps definition)
```

## 2. Data Flow Diagram
```
User input (ui/inputs) 
 -> RHF control (core/form useForm + schema.ts validation)
 -> hooks/use-shipping-bill-form (watch, setValue, field arrays)
 -> model.ts pure fns (invoiceTotal/lineTotal/toShippingBillPayload) for derived display
 -> handleSave: store/demo-store.saveBill -> localStorage v2 + payload
             -> services/shipping-bill-service.upsert -> POST /api/shipping-bills (try/catch offline-tolerant)
Dashboard: services.list() -> normalizeApiBills or internalBills -> useState bills -> filter/sort -> Table
FlatFile: services.downloadFlatFile -> GET flat-file (blob/JSON) else generateFlatFileContent -> Blob download
Masters: demo-store snapshot -> selects; quickAdd dialogs -> saveParty/saveBranch -> publish -> re-render
```

## 3. Component Hierarchy
```
<ApplicationLayout>
  <ListDashboard> (stats Cards + search Input + Table + FlatFile/Open Buttons)
  <ShippingBillForm> (Form + SubmitButton)
    <WorkflowStepper>
    <Tabs activeTab>
      <BillHeaderSection> (exporter/consignee/port selects + BranchDialog triggers)
      <InvoiceSection> -> <InvoiceItemRows> (nested FieldArray)
      <ContainersSection> <PackingSection> <DocumentsSection> <LicensesSection>
    <PartyDialogs> (quickAdd/quickBranch)
```

## 4. Rendering Strategy
- Client-only SPA (Vite, no SSR). Routes via `core/routing` zustand router: `Route(routes.dashboard, <ListDashboard/>)`, lazy `() => import('@/shipping-bills/shipping-bill-form')` for new/edit.
- HMR: each file exports ONLY React component (no const/object exports mixed) per README; schema/model/services in non-component files.
- Forms: `...register('name')` for native inputs, `<Select<T> name="name"/>` for custom selects (fe-zen-arch requirement). `Form` wrapper provides context via `getFormContext`.
- Build chunking preserved: `manualChunks` in `vite.config.js` (v/react, v/form, v/fetch, v/popover).

## 5. Third-Party Service Boundaries
- `fe-zen-arch` = internal platform (core/ui/icons/auth) — allowed, aliased via tsconfig paths + vite alias.
- Backend `PUBLIC_API_URL` = external, accessed ONLY via `services/*`, never directly in components. Headers + currency/date transforms isolated there.
- localStorage = mock persistence boundary inside `store/demo-store` only.
- No other externals; Tailwind for styling; no analytics/sentry in scope.
