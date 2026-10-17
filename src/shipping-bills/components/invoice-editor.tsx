import { formatAmount, textOr } from '@/shared/format'
import { useFieldArray } from 'core/form'
import { Button } from 'ui/basic/button'
import { Card, CardContent, CardHeader } from 'ui/basic/card'
import { getFormContext } from 'ui/form'
import { Checkbox } from 'ui/inputs/checkbox'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { useFormOptions } from '../hooks/use-form-options'
import { inputDateType } from '../input-date-type'
import type { BillInvoiceForm, ShippingBillFormValues } from '../model'
import { emptyItem, invoiceTotal } from '../model'
import { useDemoData } from '../store/demo-store'
import { InvoiceCharges } from './invoice-charges'
import { InvoiceItemEditor } from './invoice-item-editor'
import { PartyBranchPath, PartyFields } from './party-fields'

interface InvoiceEditorProps {
  index: number
  invoice: BillInvoiceForm
  canRemove: boolean
  onRemove: () => void
  onQuickAdd: (role: 'buyer' | 'thirdParty' | 'itemThirdParty', itemIndex?: number) => void
  onAddBranch: (ownerId: number, branchName: PartyBranchPath) => void
}

// One commercial invoice: header fields, charges, parties and its goods line items.
export function InvoiceEditor({ index, invoice, canRemove, onRemove, onQuickAdd, onAddBranch }: InvoiceEditorProps) {
  const { register, control, watch } = getFormContext().hooks
  const { options } = useFormOptions()
  const { businesses } = useDemoData()
  const invoiceValues = watch(`invoices.${index}`)
  const {
    fields: items,
    append: addItem,
    remove: removeItem
  } = useFieldArray({ control, name: `invoices.${index}.items` })
  const buyerSame = watch(`invoices.${index}.buyerSameAsConsignee`)
  const buyerOptions = businesses.filter((business) => business.isBuyer || business.id === Number(invoice.buyerId))
  const thirdPartyOptions = businesses.filter(
    (business) => business.isThirdParty || business.id === Number(invoice.thirdPartyId)
  )

  return (
    <Card className="mb-6 overflow-hidden rounded-xl border border-gray-200 shadow-xs">
      <CardHeader className="flex-row items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-3.5">
        <div className="flex items-center gap-3">
          <span className="bg-primary-600 flex size-7 items-center justify-center rounded-lg text-xs font-bold text-white shadow-xs">
            #{index + 1}
          </span>
          <div>
            <h3 className="text-sm font-bold text-gray-950">
              {invoiceValues.invoiceNumber
                ? `Invoice #${invoiceValues.invoiceNumber}`
                : `Commercial Invoice ${index + 1}`}
            </h3>
            <p className="text-xs font-medium text-gray-800">
              {textOr(invoiceValues.currency, 'USD')} ·{' '}
              {(options?.contractTypes ?? []).find((option) => option.value === invoiceValues.contractType)?.label ??
                textOr(invoiceValues.contractType, 'FOB')}
            </p>
          </div>
        </div>
        {canRemove && (
          <Button
            size="sm"
            variant="ghost"
            type="button"
            className="text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={onRemove}>
            Remove invoice
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Invoice number" {...register(`invoices.${index}.invoiceNumber`)} />
          <Input label="Invoice date" type={inputDateType} {...register(`invoices.${index}.invoiceDate`)} />
          <div className="flex gap-2">
            <div className="w-[100px] shrink-0">
              <Select<ShippingBillFormValues>
                label="Currency"
                name={`invoices.${index}.currency`}
                options={options?.currencies ?? []}
                rules={{ required: true }}
              />
            </div>
            <div className="flex-1">
              <Input
                label="Total"
                type="number"
                min={0}
                {...register(`invoices.${index}.invoiceTotal`)}
                placeholder="0.00"
              />
            </div>
          </div>
          <Select<ShippingBillFormValues>
            label="Contract"
            name={`invoices.${index}.contractType`}
            options={options?.contractTypes ?? []}
            rules={{ required: true }}
          />
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-gray-950">
            <Checkbox {...register(`invoices.${index}.buyerSameAsConsignee`)} />
            Buyer &amp; consignee are same
          </label>
        </div>
        {!buyerSame && (
          <PartyFields
            ownerName={`invoices.${index}.buyerId`}
            branchName={`invoices.${index}.buyerBranchId`}
            label="Buyer"
            kind="business"
            parties={buyerOptions}
            onQuickAdd={() => onQuickAdd('buyer')}
            onAddBranch={(ownerId) => onAddBranch(ownerId, `invoices.${index}.buyerBranchId`)}
          />
        )}

        <InvoiceCharges basePath={`invoices.${index}`} invoice={invoice} />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select<ShippingBillFormValues>
            label="Price includes"
            name={`invoices.${index}.freightInsuranceIncluded`}
            options={options?.priceInclusionTypes ?? []}
            placeholder="Select if applicable"
          />
          <Input label="Contract / order number" {...register(`invoices.${index}.contractNumber`)} />
          <Select<ShippingBillFormValues>
            label="Payment type"
            name={`invoices.${index}.natureOfPayment`}
            options={options?.paymentTypes ?? []}
            placeholder="Select if applicable"
          />
          <Input label="Payment period (days)" type="number" {...register(`invoices.${index}.periodOfPayment`)} />
        </div>
        <PartyFields
          ownerName={`invoices.${index}.thirdPartyId`}
          branchName={`invoices.${index}.thirdPartyBranchId`}
          label="Third party (optional)"
          kind="business"
          parties={thirdPartyOptions}
          required={false}
          onQuickAdd={() => onQuickAdd('thirdParty')}
          onAddBranch={(ownerId) => onAddBranch(ownerId, `invoices.${index}.thirdPartyBranchId`)}
        />

        <div className="border-t border-gray-200 pt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-950">Goods &amp; Line Items ({items.length})</h3>
              <p className="text-xs font-medium text-gray-800">
                HS code classification, quantity, unit price, and customs schemes for each product.
              </p>
            </div>
            <Button size="sm" type="button" variant="outline" onClick={() => addItem(emptyItem())}>
              + Add item
            </Button>
          </div>
          <div className="space-y-4">
            {items.map((field, itemIndex) => {
              const item = invoice.items[itemIndex] ?? emptyItem()
              return (
                <InvoiceItemEditor
                  key={field.id}
                  invoiceIndex={index}
                  itemIndex={itemIndex}
                  item={item}
                  invoiceCurrency={invoice.currency}
                  canRemove={items.length > 1}
                  onRemove={() => removeItem(itemIndex)}
                  onQuickAdd={() => onQuickAdd('itemThirdParty', itemIndex)}
                  onAddBranch={(ownerId) =>
                    onAddBranch(ownerId, `invoices.${index}.items.${itemIndex}.itemThirdPartyBranchId`)
                  }
                />
              )
            })}
          </div>
        </div>

        <div className="text-right text-sm font-semibold">
          Invoice total: {invoice.currency} {formatAmount(invoiceTotal(invoice))}
        </div>
      </CardContent>
    </Card>
  )
}
