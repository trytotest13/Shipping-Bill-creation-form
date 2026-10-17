import { clsx } from 'ui/utils'
import { workflowSteps } from '../workflow'

export function WorkflowStepper() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {workflowSteps.map((step, index) => {
        const isShippingBill = step.id === 'shipping-bill'
        return (
          <div
            key={step.id}
            className={clsx(
              'relative flex flex-col justify-between rounded-xl border p-3.5 transition-all',
              isShippingBill
                ? 'border-primary-600 bg-primary-50 ring-primary-600/30 dark:border-primary-500 dark:bg-primary-950/40 shadow-xs ring-1'
                : 'border-gray-200 bg-gray-50'
            )}>
            <div className="flex items-center gap-2.5">
              <span
                className={clsx(
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  isShippingBill
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'border border-gray-300 bg-gray-100 text-gray-950'
                )}>
                {index + 1}
              </span>
              <span
                className={clsx(
                  'text-sm font-bold tracking-tight',
                  isShippingBill ? 'text-primary-950 dark:text-primary-100' : 'text-gray-950'
                )}>
                {step.title}
              </span>
            </div>
            <p
              className={clsx(
                'mt-1.5 ml-8.5 text-xs font-semibold',
                isShippingBill ? 'text-primary-800 dark:text-primary-200' : 'text-gray-800'
              )}>
              {step.description}
            </p>
          </div>
        )
      })}
    </div>
  )
}
