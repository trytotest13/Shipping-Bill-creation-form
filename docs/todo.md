# Todo — Live Tracker (update after EVERY task; instruction: move next to [/], done to [x])

## [/] In Progress

- (none)

## [ ] Todo (Phase 4)

- [ ] T4.5 Deploy updated build to Vercel + final re-submission

## [x] Done

- [x] T4.1 Error-state audit (async-search-select gains loading/empty/error states; flat-file + list/save failures typed via shared/errors.ts; no silent catch regressions)
- [x] T4.2 A11y + lint pass: ESLint 159 → 0 errors (strictTypeChecked incl. prefer-nullish/no-unnecessary-condition/no-base-to-string), tsc --incremental clean, prettier clean (pnpm lint-check exit 0)
- [x] T4.3 Decomposition completed (Phase 3 remainder + dashboard): monolith shipping-bill-form.tsx (1816 lines) deleted; components/ tree built (see docs/architecture.md); dashboard split into bill-filters/bills-table/stat-cards; model→model/ folder; service split into api-client + mapper + flat-file + api-seed + facade; demo-store split demo-seed; party-dialogs split into party-dialog + branch-dialog; options.ts centralizes select constants + inputDateType workaround
- [x] T4.4 Build + smoke: pnpm build green (chunks preserved, page lazy chunk 92.5kB); dev-server smoke test: dashboard 22 API bills render, /new form renders all 3 tabs with sections mounted, /:id edit works for demo-store (3000/Draft #2081) and API-seed (1000/Draft #150011) bills
- [x] Stability fixes: item "unit of rate" placeholder read invoice.items[index] (crash on invoice #2) → now item.unitOfMeasurement; all `catch (err: any)` → unknown + errorMessage(); floating promise in dashboard fetch wrapped with cancellation; branch/party delete guards + branch upsert made generic
- [x] T3.7 Dashboard thin pass (bill-filters.ts pure helpers + BillsTable + StatCards; list-dashboard ~120 lines)
- [x] T3.6 Dialogs + stepper + slim orchestrator (party-dialog.tsx, branch-dialog.tsx, workflow-stepper.tsx, bill-form-header/footer, shipping-bill-page orchestrator, use-save-shipping-bill hook)
- [x] T3.5 Containers/packing/docs/licenses sections (cargo-section.tsx, documents-section.tsx with reusable issuing/beneficiary PartyAddressFields, licenses-section.tsx)
- [x] T3.4 Invoice + items sections (invoices-section owns field array; invoice-editor per-invoice card; invoice-item-editor per line; invoice-charges rate/amount/currency row reused 6×)
- [x] T3.3 Bill header section (details-section.tsx: parties, route, regulatory, package detail; scoped watches; marks-and-numbers hook wired locally)
- [x] T3.2 Extract hooks (use-shipping-bill-form 50 lines + use-marks-and-numbers 45 lines; form -84/+20; starter 11b8d47)
- [x] T3.1 Extract schema.ts (schema.ts 56 lines byte-identical rules; form -51/+2 lines; starter aba1847)
- [x] T2.1 Move demo-store → store/ + T2.2 service → services/ + T2.3 party/marks → services/ (starter commits 30b450c renames + ae68b55 10-line import rewire; tsc shows only 6 pre-existing errors in untouched monolith lines, zero module-resolution errors)
- [x] T2.4 Auth/interceptors verify (index.tsx wiring + shared/interceptors.ts untouched by moves; starter tree clean; no auth regression)
- [x] T1.3 Freeze inventory (src 23 files; monolith shipping-bill-form.tsx 1702 lines/77541B; model 504/18822; demo-store 636/18329; service 452/24032; party-dialogs 289/12665; internal fns: SectionHeading, Advanced, PersistentTab, AsyncPartySelect, PopoverOptionItem, PartyFields, InvoiceEditor, DocumentItem, BillEditor, ShippingBillPage; billSchema 30 leaf rules incl. positive qty/unitPrice)
- [x] T1.2 Submodule + pnpm install + dev/lint baseline (fe-zen-arch-ref @4c461ba matches pinned submodule; starter cloned locally (gitignored); pnpm install 556 pkgs OK; vite 8.3.1 OK; lint.sh is bash-only so ran prettier check (132 files need --write, line-ending noise) + tsc timed out on first pass — retry in T4.4)
- [x] T1.1 Git init + .gitignore + .env.example + verify (commit 4e3cf15, 10 files, no .env tracked, .env.example committed)
