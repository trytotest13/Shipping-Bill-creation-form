import { DarkModeToggle } from 'ui/basic/dark-mode'

interface ApplicationLayoutProps {
  children?: React.ReactNode
  maxWidth?: string
}

export function ApplicationLayout({ children, maxWidth }: ApplicationLayoutProps) {
  return (
    <div className="foreground relative isolate flex min-h-svh w-full flex-col">
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-2.5 backdrop-blur-xs print:hidden">
        <div className="flex items-center gap-2.5">
          <span className="bg-primary-600 flex size-7 items-center justify-center rounded-lg text-xs font-black text-white shadow-xs">
            ES
          </span>
          <span className="text-sm font-bold tracking-tight text-gray-950">Export Software</span>
          <span className="hidden rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-800 sm:inline-block">
            ICEGATE EDI
          </span>
        </div>
        <div className="flex items-center gap-3">
          <DarkModeToggle />
        </div>
      </header>

      <main className="grow print:m-0 print:p-0">
        <div className="background m-2 h-full rounded-xl p-4 sm:p-6 print:m-0 print:p-0">
          <div className="mx-auto h-full" style={{ maxWidth: maxWidth ?? '72rem' }}>
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
