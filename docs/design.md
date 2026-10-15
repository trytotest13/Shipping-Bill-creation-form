# Design — Tokens (extracted from current Tailwind usage, do not invent new)

## 1. Color Palette (hex + Tailwind classes)
- Background page: `bg-white` / `#ffffff`; muted section bg: `bg-gray-50` `#f9fafb`
- Text primary: `text-gray-950` `#020617`-ish (use `gray-950`); secondary: `text-gray-500` `#6b7280`; faint: `text-gray-400`
- Border: `border-gray-200` `#e5e7eb`, dashed empty: `border-gray-300` `#d1d5db`
- Primary action: `Button` default (fe-zen-arch `ui/basic/button` — dark solid); secondary: `variant="outline"`; danger/error text: `text-red-600` via `InputError`
- Badge draft: `variant="secondary"` (`bg-gray-100 text-gray-700`)
- Focus ring: default `ui/inputs` focus (do not override)

## 2. Typography Scale
- Page H1: `text-2xl font-semibold text-gray-950` (dashboard "Shipping bills")
- Section header: `text-base font-semibold` inside `CardHeader`
- Label: `text-sm font-medium text-gray-700` (via `ui/inputs`)
- Helper/error: `text-xs text-gray-500` / `text-xs text-red-600` (`InputError`)
- Table: `text-sm`, header `text-xs uppercase tracking-wide text-gray-500`, cell strong `font-medium`
- Stat number: `text-2xl font-semibold`

## 3. Spacing Scale
- Page: `space-y-6`; card padding: `CardContent pt-5`, inner `space-y-4` / `grid gap-3` / `gap-4`
- Form grids: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3` (header), `gap-2` for action rows
- Toolbar: `flex flex-wrap items-start justify-between gap-4`; row actions `flex items-center justify-end gap-2`
- Empty state: `p-10 text-center`, CTA `mt-4`

## 4. Radii, Shadows
- Cards: `rounded-lg border border-gray-200 shadow-sm` (via `ui/basic/card`)
- Inputs: `rounded-md border-gray-300` (via `ui/inputs/input/select`)
- Buttons: `rounded-md` (via `ui/basic/button`), `size="sm"` for table actions
- Popover/Dialog: `rounded-lg shadow-lg` (via `ui/interactive/popover`)
- Table wrapper: `rounded-lg border overflow-x-auto`

## 5. Core Component Styles (must reuse, no ad-hoc)
- `Button variant="outline" size="sm"` for Sync/Flat File/Open; default `Button` for New/Create/Submit (`SubmitButton` in form)
- `Card > CardHeader + CardContent` for each section (Details, Invoices, Containers, Packing, Docs, Licenses, Stats)
- `Table > thead th + tbody tr td`, right-align actions `className="text-right"`
- `Input`, `Select<T> name`, `Checkbox`, `InputError`, `Badge variant="secondary"`, `Tabs/TabsList/TabsTrigger`, `Popover + PopoverTrigger/Content`
- Icons: `RrCaretDown` for select affordance only
- Do NOT introduce new colors/fonts/spacing; match existing classes exactly.
