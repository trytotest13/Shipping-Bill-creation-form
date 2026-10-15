# Todo — Live Tracker (update after EVERY task; instruction: move next to [/], done to [x])

## [/] In Progress
- [ ] T3.3 Bill header section

## [ ] Todo (Phase 1)
- [ ] T1.2 Submodule + pnpm install + dev/lint baseline
- [ ] T1.3 Freeze inventory

## [ ] Todo (Phase 2)
- [ ] T2.1 Move demo-store → store/
- [ ] T2.2 Move shipping-bill-service → services/
- [ ] T2.3 Move party/marks services → services/
- [ ] T2.4 Auth/interceptors verify

## [ ] Todo (Phase 3)
- [ ] T3.1 Extract schema.ts
- [ ] T3.2 Extract hooks
- [ ] T3.3 Bill header section
- [ ] T3.4 Invoice + items sections
- [ ] T3.5 Containers/packing/docs/licenses
- [ ] T3.6 Dialogs + stepper + slim orchestrator
- [ ] T3.7 Dashboard thin pass

## [ ] Todo (Phase 4)
- [ ] T4.1 Error-state audit
- [ ] T4.2 A11y pass
- [ ] T4.3 Design compliance
- [ ] T4.4 Lint+build+secret scan

## [x] Done
- [x] T1.1 Git init + .gitignore + .env.example + verify (commit 4e3cf15, 10 files, no .env tracked, .env.example committed)
- [x] T1.2 Submodule + pnpm install + dev/lint baseline (fe-zen-arch-ref @4c461ba matches pinned submodule; starter cloned locally (gitignored); pnpm install 556 pkgs OK; vite 8.3.1 OK; lint.sh is bash-only so ran prettier check (132 files need --write, line-ending noise) + tsc timed out on first pass — retry in T4.4)
- [x] T1.3 Freeze inventory (src 23 files; monolith shipping-bill-form.tsx 1702 lines/77541B; model 504/18822; demo-store 636/18329; service 452/24032; party-dialogs 289/12665; internal fns: SectionHeading, Advanced, PersistentTab, AsyncPartySelect, PopoverOptionItem, PartyFields, InvoiceEditor, DocumentItem, BillEditor, ShippingBillPage; billSchema 30 leaf rules incl. positive qty/unitPrice)
- [x] T2.1 Move demo-store → store/ + T2.2 service → services/ + T2.3 party/marks → services/ (starter commits 30b450c renames + ae68b55 10-line import rewire; tsc shows only 6 pre-existing errors in untouched monolith lines, zero module-resolution errors)
- [x] T2.4 Auth/interceptors verify (index.tsx wiring + shared/interceptors.ts untouched by moves; starter tree clean; no auth regression)
- [x] T3.1 Extract schema.ts (schema.ts 56 lines byte-identical rules; form -51/+2 lines; starter aba1847)
- [x] T3.2 Extract hooks (use-shipping-bill-form 50 lines + use-marks-and-numbers 45 lines; form -84/+20; starter 11b8d47)
