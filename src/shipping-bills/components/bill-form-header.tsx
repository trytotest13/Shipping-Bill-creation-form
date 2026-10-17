import { textOr } from '@/shared/format'
import { routes } from '@/shared/route-paths'
import { navigate } from 'core/routing'
import type { SavedBill } from '../model'

interface BillFormHeaderProps {
  bill?: SavedBill
}

export function BillFormHeader({ bill }: BillFormHeaderProps) {
  return (
    <div className="space-y-1">
      <button
        type="button"
        className="group mb-1 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-800 transition-colors hover:text-gray-950"
        onClick={() => navigate(routes.dashboard)}>
        <span className="transition-transform group-hover:-translate-x-0.5">←</span> Back to Shipping bills
      </button>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950">
            {bill ? `Edit shipping bill #${bill.id}` : 'New shipping bill'}
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-800">
            Enter the everyday details first. Open advanced sections only when needed.
          </p>
        </div>
        {bill && (
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-emerald-600/30 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300">
              Draft #{textOr(bill.values.jobNumber, String(bill.id))}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
