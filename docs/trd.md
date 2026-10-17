# TRD — Shipping Bill Zen Refactor

## 1. Tech Stack (pinned from starter)

- `react@^19.3.0`, `react-dom@^19.3.0`
- `vite@^8.3.1` + `@vitejs/plugin-react@^6.1.1`, entry `src/index.tsx`, dev `vite -- 5173 src/index.tsx`
- `typescript@^6.0.3` strict, `moduleResolution:bundler`, `jsx:react-jsx`, `target:ES2020`, `lib:[ES2024,DOM,DOM.Iterable]`
- `tailwindcss@^4.3.3` + `@tailwindcss/postcss@^4.3.3`, `postcss@8.5.28`, `autoprefixer`, `cssnano`
- `fe-zen-arch` git submodule (`git@github.com:shivamkj/fe-zen-arch.git`, path `fe-zen-arch`): provides `core/*` (form=`s`+`useForm`+`useFieldArray`, routing, toast-manager), `ui/*` (basic/button/card/badge/table, inputs/input/select/checkbox/error, interactive/popover/tabs, form, utils), `icons/*`, `auth`
- No new deps allowed — RHF/Zustand/React-Query come ONLY from `fe-zen-arch` if needed; root `package.json` stays with react/react-dom only.
- Lint pipeline: `bash fe-zen-arch/scripts/lint.sh` (`lint` with --fix, `lint-check` without), prettier `trailingComma:none, tabWidth:2, printWidth:120, semi:false, singleQuote:true` + `organize-imports` + `tailwindcss` plugins; `cspell`, `eslint 10`, `check-file`.

## 2. State Management + Rationale

- **Form state:** `useForm` from `core/form` (RHF wrapper) + `useFieldArray` for invoices/items/containers/packingRanges/documents/licenses. Rationale: already used, preserves validation + dirty tracking, no new dep.
- **Server cache:** `shippingBillService` async functions called directly with `useState/useEffect` in dashboard/form (current pattern). React-Query from `fe-zen-arch` OPTIONAL only if already exported — do not add `@tanstack/react-query` to root. Prefer thin `services/*-query.ts` wrappers if needed later.
- **Client UI state:** Local `useState` for `activeTab`, `draftId`, `quickAdd/quickBranch`, `marksAndNumbersOptions/loading`, `search/isLoading/downloadingId`. Zustand router via `core/routing` (`navigate`, `useParams`). No global Zustand store needed for form (avoids duplication with RHF).
- **Master data:** `demo-store.ts` `useSyncExternalStore` snapshot (`exporters,businesses,bills`) + localStorage `export-software-shipping-bills-v2`. Keep as mock repository until backend ready.

## 3. Key Packages (already available, do not install)

- `core/form`: `s` (schema builder), `useForm`, `useFieldArray`
- `core/form/components`: `Form`, `SubmitButton`
- `core/routing`: `navigate`, `useParams`, `Route`, `RouteObject`
- `core/toast-manager`: `toast`
- `ui/basic/*`, `ui/inputs/*`, `ui/interactive/*`, `ui/form`, `ui/utils` (`clsx`, `getContext`)
- `icons/rr/fi-rr-caret-down`

## 4. API Strategy (API-ready mocks, offline-tolerant)

- Base: `import.meta.env.VITE_BASE_URL || PUBLIC_API_URL || 'http://192.168.1.123:3408'`, headers `Accept:application/json, Content-Type:application/json, Authorization:tenantId=1000&user=1000&role=1`
- Endpoints (per `shipping_bill.http` + service):
  - `GET /api/shipping-bills` → `list(): SavedBill[]` (fallback to `internalBills`)
  - `POST /api/shipping-bills` → `upsert(values)` with `toHttpShippingBillPayload()` (dates→epoch-days, currency map USD840/INR356/EUR978/AED784/GBP826/SGD702, KG→KGS)
  - `GET /api/shipping-bills/:id/flat-file` → `getFlatFile()` / `downloadFlatFile()` (blob or JSON→text, content-disposition filename, fallback `generateFlatFileContent()`)
  - Party lookups: `partyMockService` + `getMarksAndNumbersOptions(exporterId)` (cancellable, loading flag)
- Rule: **Don't use react-query mutation for RHF submit handler** (README). Submit = `saveBill` sync + `await upsert` try/catch.
- All fetches must handle loading/empty/error + console.warn + toast.

## 5. Auth Setup

- Reuse `fe-zen-arch` auth module (routes, interceptors, login pages) out of box. `src/shared/interceptors.ts` wires headers. No change in this refactor.

## 6. Environment Variables

| Name                 | Used for                                    | Example                     |
| -------------------- | ------------------------------------------- | --------------------------- |
| `PUBLIC_API_URL`     | API base (vite `envPrefix:[VITE_,PUBLIC_]`) | `http://192.168.1.123:3408` |
| `VITE_BASE_URL`      | Override base if set                        | same as above               |
| `APP_NAME`           | Title/branding                              | `EXPORT-SOFTWARE`           |
| `PUBLIC_ENTRY_POINT` | Set by `vite.config.js` from CLI argv       | `src/index.tsx`             |
| `NODE_ENV`           | Prod build flag                             | `production`                |

See `.env.example` (placeholders only, never real secrets).
