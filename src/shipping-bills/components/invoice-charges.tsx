import { getFormContext } from 'ui/form'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import type { BillInvoiceForm, ShippingBillFormValues } from '../model'
import { currencyOptions } from '../options'

type FormRegister = ReturnType<typeof getFormContext>['hooks']['register']

export type ChargeKey = 'freight' | 'insurance' | 'commission' | 'discount' | 'otherDeductions'

interface ChargeRowProps {
  label: string
  hint: string
  basePath: `invoices.${number}`
  field: ChargeKey
  currencyPlaceholder: string
  rateValue?: string
  amountValue?: string
  register: FormRegister
}

// Rate and amount are mutually exclusive: entering one disables the other.
function ChargeRow({
  label,
  hint,
  basePath,
  field,
  currencyPlaceholder,
  rateValue,
  amountValue,
  register
}: ChargeRowProps) {
  const hasRate = rateValue != null && rateValue !== ''
  const hasAmount = amountValue != null && amountValue !== ''

  return (
    <div className="py-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-950">{label}</span>
        <span className="text-[11px] font-medium text-gray-800">{hint}</span>
      </div>
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-4">
          <div className="relative">
            <Input
              type="number"
              {...register(`${basePath}.${field}Rate`)}
              className="pr-6 text-right"
              disabled={hasAmount}
              placeholder="Rate"
            />
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs font-semibold text-gray-800">
              %
            </span>
          </div>
        </div>
        <div className="col-span-5">
          <Input
            type="number"
            {...register(`${basePath}.${field}Amount`)}
            className="text-right"
            disabled={hasRate}
            placeholder="Amount"
          />
        </div>
        <div className="col-span-3">
          <Select<ShippingBillFormValues>
            name={`${basePath}.${field}Currency`}
            options={currencyOptions}
            placeholder={currencyPlaceholder}
          />
        </div>
      </div>
    </div>
  )
}

interface PackingChargeRowProps {
  basePath: `invoices.${number}`
  currency: string
  register: FormRegister
}

function PackingChargeRow({ basePath, currency, register }: PackingChargeRowProps) {
  return (
    <div className="py-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-950">Packing Charges</span>
        <span className="text-[11px] font-medium text-gray-800">Flat Amount</span>
      </div>
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-9">
          <Input
            type="number"
            {...register(`${basePath}.packingCharges`)}
            className="text-right"
            placeholder="Amount"
          />
        </div>
        <div className="col-span-3 flex items-center justify-center">
          <span className="text-xs font-semibold text-gray-800">{currency || 'USD'}</span>
        </div>
      </div>
    </div>
  )
}

const leftColumnCharges: { key: ChargeKey; label: string }[] = [
  { key: 'freight', label: 'Freight' },
  { key: 'commission', label: 'Commission' },
  { key: 'otherDeductions', label: 'Other Deductions' }
]

const rightColumnCharges: { key: ChargeKey; label: string }[] = [
  { key: 'insurance', label: 'Insurance' },
  { key: 'discount', label: 'Discount' }
]

export interface InvoiceChargesProps {
  basePath: `invoices.${number}`
  invoice: BillInvoiceForm
}

// Freight, insurance, commission, discount, other deductions and packing charges for one invoice.
export function InvoiceCharges({ basePath, invoice }: InvoiceChargesProps) {
  const { register } = getFormContext().hooks

  function renderCharge(charge: { key: ChargeKey; label: string }) {
    return (
      <ChargeRow
        key={charge.key}
        label={charge.label}
        hint="Rate or Amount"
        basePath={basePath}
        field={charge.key}
        currencyPlaceholder={invoice.currency}
        rateValue={invoice[`${charge.key}Rate`]}
        amountValue={invoice[`${charge.key}Amount`]}
        register={register}
      />
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-semibold text-gray-950">Charges &amp; Deductions</h4>
        <p className="text-xs text-gray-800">Specify rate % or amount for freight, insurance, and other adjustments.</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 divide-y divide-gray-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          <div className="divide-y divide-gray-200 p-2 sm:p-3">{leftColumnCharges.map(renderCharge)}</div>
          <div className="divide-y divide-gray-200 p-2 sm:p-3">
            {rightColumnCharges.map(renderCharge)}
            <PackingChargeRow basePath={basePath} currency={invoice.currency} register={register} />
          </div>
        </div>
      </div>
    </div>
  )
}
