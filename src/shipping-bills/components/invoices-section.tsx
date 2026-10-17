import { useFieldArray } from 'core/form'
import { Button } from 'ui/basic/button'
import { getFormContext } from 'ui/form'
import type { BillInvoiceForm } from '../model'
import { emptyInvoice } from '../model'
import { InvoiceEditor } from './invoice-editor'
import { PartyBranchPath } from './party-fields'

export interface InvoicesSectionCallbacks {
  onQuickAdd: (role: 'buyer' | 'thirdParty' | 'itemThirdParty', invoiceIndex: number, itemIndex?: number) => void
  onAddBranch: (ownerId: number, branchName: PartyBranchPath) => void
}

// Owns the invoices field array and renders one editor per invoice.
export function InvoicesSection({ onQuickAdd, onAddBranch }: InvoicesSectionCallbacks) {
  const { control, watch } = getFormContext().hooks
  const { fields: invoices, append: addInvoice, remove: removeInvoice } = useFieldArray({ control, name: 'invoices' })
  const invoiceValues = watch('invoices') as BillInvoiceForm[]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-gray-950">Invoices &amp; goods</h2>
            <span className="bg-primary-600 rounded-full px-2.5 py-0.5 text-xs font-bold text-white shadow-xs">
              {invoices.length} {invoices.length === 1 ? 'Invoice' : 'Invoices'}
            </span>
          </div>
          <p className="mt-0.5 text-xs font-medium text-gray-800">
            Manage commercial invoices and item-level export details.
          </p>
        </div>
        <Button type="button" className="shadow-xs" onClick={() => addInvoice(emptyInvoice())}>
          + Add invoice
        </Button>
      </div>
      {invoices.map((field, index) => (
        <InvoiceEditor
          key={field.id}
          index={index}
          invoice={invoiceValues[index] ?? emptyInvoice()}
          canRemove={invoices.length > 1}
          onRemove={() => removeInvoice(index)}
          onQuickAdd={(role, itemIndex) => onQuickAdd(role, index, itemIndex)}
          onAddBranch={onAddBranch}
        />
      ))}
    </div>
  )
}
