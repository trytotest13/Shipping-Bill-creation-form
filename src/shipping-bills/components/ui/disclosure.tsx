export interface DisclosureProps {
  title: string
  children: React.ReactNode
  open?: boolean
  onToggle?: (isOpen: boolean) => void
}

// Collapsible block used for progressive disclosure of rarely edited field groups.
export function Disclosure({ title, children, open, onToggle }: DisclosureProps) {
  return (
    <details
      className="group rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all"
      open={open}
      onToggle={(event) => onToggle?.(event.currentTarget.open)}>
      <summary className="hover:text-primary-600 flex cursor-pointer items-center justify-between text-sm font-semibold text-gray-950 select-none">
        <span>{title}</span>
        <span className="text-xs font-normal text-gray-800 transition-transform group-open:rotate-180">▼</span>
      </summary>
      <div className="mt-4 border-t border-gray-200 pt-3">{children}</div>
    </details>
  )
}
