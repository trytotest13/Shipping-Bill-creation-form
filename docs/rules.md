# Rules — Coding Standards (enforced always)

## 1. TypeScript Strict

- `strict:true`, `noUnusedLocals/Parameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`. No `any` unless justified in comment (`// any-justified: <reason>`). Prefer `unknown` + narrowing. All form values typed via `ShippingBillFormValues` etc. from `model.ts`.

## 2. Naming Conventions

- Files: `kebab-case.tsx/.ts` (`bill-header-section.tsx`, `use-shipping-bill-form.ts`, `shipping-bill-service.ts`); Components: `PascalCase`; hooks: `use-*`; services: `*-service.ts`; schema: `schema.ts`; store: `demo-store.ts`.
- `eslint-plugin-check-file` enforced. Routes in `route-paths.ts`, route objects in `routes.tsx`.

## 3. Error Handling

- Every async (list/upsert/flat-file/marksAndNumbers) has loading + try/catch + empty + error toast/console.warn. RHF submit failure → toast + tab routing + console.log errors. Never swallow errors silently. Never use react-query mutation for RHF submit.

## 4. Import Ordering (prettier organize-imports)

1. `@/data/*` 2. `@/shared/*` 3. `@/shipping-bills/*` 4. `core/*` 5. `icons/*` 6. `react` 7. `ui/*`. No circular imports; services never import components.

## 5. Banned Patterns

- ❌ Adding npm deps (`pnpm add` forbidden — use fe-zen-arch only). ❌ Hardcoded API keys/URLs/secrets in code. ❌ Generic form templates (use `useForm` from `core/form` + `Form/SubmitButton`). ❌ `...register` on custom Select (use `<Select<T> name>`). ❌ Mixed component+const exports in one file (HMR: export only component). ❌ Ad-hoc Tailwind colors/spacing outside design.md. ❌ `any`, `console.log` in prod paths (allow `console.warn` for API fallback + `console.log` for save payload per current behavior, remove before commit if noisy).

## 6. Formatting

- Prettier: `semi:false, singleQuote:true, printWidth:120, tabWidth:2, trailingComma:none`, plugins `organize-imports`, `tailwindcss`. Run `pnpm lint` (--fix) before commit. `cspell` clean.

## 7. Sensitive-Data Rules (MANDATORY)

- NEVER hardcode API keys, passwords, tokens, DB URLs, or secrets in code.
- All secrets live ONLY in `.env` (gitignored) accessed via `import.meta.env.PUBLIC_* / VITE_*` with runtime fallback; only `.env.example` (placeholders) may be committed.
- If secret ever committed, STOP and instruct user to rotate key immediately — removal from history alone is not enough.
- Before any commit, scan staged files for keys/tokens/connection strings (`git diff --cached | grep -Ei 'api[_-]?key|secret|token|password|connection string'`) and warn user.
