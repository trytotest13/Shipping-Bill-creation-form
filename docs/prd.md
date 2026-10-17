# PRD — Export Software: Shipping Bill Zen Refactor (assignment-01)

## 1. Problem Statement

The current `src/shipping-bills/shipping-bill-form.tsx` (~75KB, single file) mixes UI rendering, React-Hook-Form state, Zod-ish validation (`core/form` `s` schema), business calculations (`model.ts`), persistence (`demo-store.ts` + `shipping-bill-service.ts`), and party quick-add dialogs. This makes the form hard to review, test, debug at scale (hundreds of pages ambition), and risky to extend for Document Review / Customs Filing / Tracking workflow steps.

We must refactor to strict separation: UI / state / business-logic / async API-ready mock services — **without adding new dependencies** and without losing any existing field, calculation, or domain rule.

## 2. Target Audience / Personas

- **CHA Operator (Primary):** Creates/edits Shipping Bills daily, needs fast tabbed entry, inline errors, draft save, flat-file (.sb) download for ICEGATE.
- **Exporter Back-office:** Manages exporter + consignee/buyer/notify/third-party masters + branches, quick-adds missing party mid-form.
- **Reviewer / QA (Internshala evaluator):** Checks modularity, reusability, TypeScript strictness, error states, no-new-deps, lint/build green.
- **Future Maintainer:** Adds Document Review, Customs Filing, Shipment Tracking steps via `workflow.ts`.

## 3. Core Functional Requirements

- **FR-1 — Dashboard list:** List saved bills from `shippingBillService.list()` with local fallback; search across jobNumber/exporter/consignee/invoiceNumber; sort by `updated` desc; stat cards (bills count, unique exporters, unique consignees); actions Open + Flat File download.
- **FR-2 — Create bill:** Route `/shipping-bills/new` renders empty bill from `emptyBill()` with default jobDate, tabs Details / Invoices (+items) / Containers+Packing+Docs+Licenses.
- **FR-3 — Edit bill:** Route `/shipping-bills/:id` loads bill via `demo-store`/`service.getInitialBills()`; preserves `draftId`; saves update, not duplicate.
- **FR-4 — Header/Details section:** jobNumber, jobDate (required), exporterId+exporterBranchId (required, branch filtered by exporter), consigneeId+consigneeBranchId (required), loadingPort/finalDestinationPort (required), dischargePort, originState, NFEI, RBI waiver, sealType, cargo nature, weights, packages, marksAndNumbers (async options by exporterId), loose packets, MAWB/HAWB.
- **FR-5 — Invoices + Items:** `useFieldArray(invoices)` + nested `items`; fields per `BillInvoiceForm`/`BillItemForm` in `model.ts`: invoiceNumber/Date/currency/contractType/buyer/ thirdParty/freight/insurance/commission/discount/otherDeductions/packingCharges/natureOfPayment; item RITC/goods desc/qty/UOM/unitPrice/scheme/drawback/RoSCTL/RoDTEP/cess/tradeAgreement etc.; computed `invoiceTotal()` + `lineTotal()` displayed, not user-editable as source of truth.
- **FR-6 — Containers / Packing / Docs / Licenses:** `useFieldArray` for containers (number/size/seal/movement doc), packingRanges (from/to/code), documents (e-Sanchit codes, refs, dates→epoch-days, parties), licenses (reg no/date, serials, qty).
- **FR-7 — Validation + error routing:** `billSchema` via `core/form` `s` object; leaf-name rules; positive qty/unitPrice; on submit fail → `toast.error`, console log, auto-switch tab (details/invoices/documents).
- **FR-8 — Save pipeline:** `handleSave` → `saveBill(values,draftId)` (localStorage `export-software-shipping-bills-v2`) + `toShippingBillPayload()` + `shippingBillService.upsert()` (POST `/api/shipping-bills`) with offline-tolerant catch; toast success; navigate to edit route with new id.
- **FR-9 — Party quick-add:** `PartyDialog`/`BranchDialog` for exporter/business + branch; create/update/delete with in-use guard (`deleteParty`/`deleteBranch` return false if referenced); refreshes selects without losing form values.
- **FR-10 — Flat file:** `downloadFlatFile(id,bill)` tries GET `/api/shipping-bills/:id/flat-file` (blob or JSON content), falls back to `generateFlatFileContent(bill)` → `shipping_bill_<job>.sb` download; per-row loading state.
- **FR-11 — Workflow stepper:** Render `workflowSteps` (shipping-bill current, document-review/customs-filing/shipment-tracking planned) with route only when available.
- **FR-12 — No-new-deps + HMR compliance:** Only `react`, `react-dom`, `fe-zen-arch` (`core/*`,`ui/*`,`icons/*`), Tailwind; each component file exports only React component for HMR.

## 4. Non-Functional Requirements

- **NFR-1 Type safety:** `strict:true`, `noUnusedLocals/Parameters`, no `any` without justification comment.
- **NFR-2 Perf:** Tab-local rendering; `watch()` scoped; field arrays keyed; manualChunks (`v/react`,`v/form`,`v/fetch`) preserved.
- **NFR-3 A11y:** Labels for all inputs, error `aria-describedby`, keyboard-accessible Tabs/Popover/Dialog, focus on tab-switch on error.
- **NFR-4 Responsive:** Mobile stacked → `sm:` grid (dashboard stats `sm:grid-cols-3`, form grids).
- **NFR-5 Reliability:** Every async (list/upsert/flat-file/marksAndNumbers) has loading/empty/error states; offline fallback never crashes.
- **NFR-6 Lint:** `pnpm lint-check` (prettier+tsc+eslint via `fe-zen-arch/scripts/lint.sh`) must pass; build `pnpm build` succeeds.

## 5. Out of Scope

- New backend endpoints, auth changes, ICEGATE filing, payment integration.
- Document Review / Customs Filing / Tracking screens (only stepper placeholder).
- Adding any npm dependency (react-hook-form/zustand/query must come from `fe-zen-arch` only).
- Migration of localStorage v2 key, analytics, i18n, dark mode.
