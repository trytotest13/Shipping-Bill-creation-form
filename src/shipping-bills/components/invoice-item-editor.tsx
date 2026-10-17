import { formatAmount } from '@/shared/format'
import { Button } from 'ui/basic/button'
import { getFormContext } from 'ui/form'
import { Checkbox } from 'ui/inputs/checkbox'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { useFormOptions } from '../hooks/use-form-options'
import { inputDateType } from '../input-date-type'
import type { BillItemForm, ShippingBillFormValues } from '../model'
import { lineTotal } from '../model'
import { useDemoData } from '../store/demo-store'
import { PartyFields } from './party-fields'
import { Disclosure } from './ui/disclosure'

function itemBase(invoiceIndex: number, itemIndex: number) {
  return `invoices.${invoiceIndex}.items.${itemIndex}` as const
}

function schemeShowsDrawback(
  schemes: { value: string; drawback?: boolean; RODTEP?: boolean; ROSCTL?: boolean }[],
  schemeCode?: string
) {
  const scheme = schemes.find((entry) => entry.value === schemeCode)
  return Boolean(scheme && (scheme.drawback ?? scheme.RODTEP ?? scheme.ROSCTL))
}

interface InvoiceItemEditorProps {
  invoiceIndex: number
  itemIndex: number
  item: BillItemForm
  invoiceCurrency: string
  canRemove: boolean
  onRemove: () => void
  onQuickAdd: () => void
  onAddBranch: (ownerId: number) => void
}

// One goods line: identification, pricing, customs incentives and optional third party.
export function InvoiceItemEditor({
  invoiceIndex,
  itemIndex,
  item,
  invoiceCurrency,
  canRemove,
  onRemove,
  onQuickAdd,
  onAddBranch
}: InvoiceItemEditorProps) {
  const { register } = getFormContext().hooks
  const { options } = useFormOptions()
  const { businesses } = useDemoData()
  const basePath = itemBase(invoiceIndex, itemIndex)

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-primary-600 flex size-6 items-center justify-center rounded-md text-xs font-bold text-white shadow-xs">
            {itemIndex + 1}
          </span>
          <h4 className="text-sm font-bold text-gray-950">
            Item {itemIndex + 1} {item.goodsDescription1 ? `— ${item.goodsDescription1.slice(0, 30)}` : ''}
          </h4>
        </div>
        {canRemove && (
          <Button
            size="sm"
            variant="ghost"
            type="button"
            className="text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={onRemove}>
            Remove item
          </Button>
        )}
      </div>
      <div className="mb-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Input label="RITC / HS code" {...register(`${basePath}.ritcCode`)} placeholder="e.g. 61091000" />
        <Select<ShippingBillFormValues>
          label="Scheme code"
          name={`${basePath}.schemeCode`}
          options={options?.schemeCodes ?? []}
          placeholder="Select scheme"
        />
        <Input
          label="Goods description"
          {...register(`${basePath}.goodsDescription1`)}
          wrapClass="lg:col-span-4"
          placeholder="e.g. Cotton T-shirts"
        />
        <Input label="Quantity" type="number" {...register(`${basePath}.quantity`)} />
        <Select<ShippingBillFormValues>
          label="Unit"
          name={`${basePath}.unitOfMeasurement`}
          options={options?.quantityCodes ?? []}
          rules={{ required: true }}
        />
        <Input
          label={`Unit price (${invoiceCurrency || 'currency'})`}
          type="number"
          {...register(`${basePath}.unitPrice`)}
        />
        <Input
          label="Item Total"
          type="number"
          placeholder={`${invoiceCurrency} ${formatAmount(lineTotal(item))}`}
          {...register(`${basePath}.lineTotal`)}
        />
        <Select<ShippingBillFormValues>
          label="IGST payment"
          name={`${basePath}.igstPaymentStatus`}
          options={options?.igstPayments ?? []}
          placeholder="Select if applicable"
        />
      </div>
      <div className="mb-3 flex flex-wrap items-end gap-4">
        {schemeShowsDrawback(options?.schemeCodes ?? [], item.schemeCode) && (
          <>
            <div className="w-36">
              <Input label="Drawback Serial no." {...register(`${basePath}.drawbackSerialNumber`)} />
            </div>
            <div className="w-32">
              <Input label="Drawback Unit" {...register(`${basePath}.drawbackUnit`)} />
            </div>
            <div className="w-36">
              <Input label="Drawback Quantity" type="number" {...register(`${basePath}.drawbackQuantity`)} />
            </div>
          </>
        )}
        <label className="flex items-center gap-2 pb-1 text-sm">
          <Checkbox {...register(`${basePath}.rewardItem`)} />
          Claim reward
        </label>
        <label className="flex items-center gap-2 pb-1 text-sm">
          <Checkbox {...register(`${basePath}.thirdPartyItem`)} />
          Third-party item
        </label>
      </div>
      {item.thirdPartyItem && (
        <div className="my-4">
          <PartyFields
            ownerName={`${basePath}.itemThirdPartyId`}
            branchName={`${basePath}.itemThirdPartyBranchId`}
            label="Item third party"
            kind="business"
            parties={businesses.filter(
              (business) => business.isThirdParty || business.id === Number(item.itemThirdPartyId)
            )}
            onQuickAdd={onQuickAdd}
            onAddBranch={onAddBranch}
          />
        </div>
      )}
      <Disclosure title="Item customs, taxes and incentives">
        <div className="mb-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select<ShippingBillFormValues>
            label="Unit of rate"
            name={`${basePath}.unitOfRate`}
            options={options?.quantityCodes ?? []}
            placeholder={item.unitOfMeasurement}
          />
          <Input label="Per Unit (Rate)" type="number" placeholder="1" {...register(`${basePath}.numberOfUnits`)} />
          <Input label="Present market value" type="number" {...register(`${basePath}.presentMarketValue`)} />
          <Input label="GCess" type="number" {...register(`${basePath}.cess`)} />
          <Input
            label="Accessories description"
            wrapClass="lg:col-span-3"
            {...register(`${basePath}.accessoriesDescription`)}
          />
          <Select<ShippingBillFormValues>
            label="Accessory status"
            name={`${basePath}.accessoryStatus`}
            options={options?.accessoryStatuses ?? []}
            placeholder="Select if relevant"
          />
          {item.igstPaymentStatus === 'P' && (
            <>
              <Input label="Taxable value" type="number" {...register(`${basePath}.taxableValue`)} />
              <Input label="IGST amount" type="number" {...register(`${basePath}.igstAmount`)} />
            </>
          )}
          <Input label="Origin district code" {...register(`${basePath}.originDistrictCode`)} />
          <Select<ShippingBillFormValues>
            label="Trade agreement code"
            name={`${basePath}.tradeAgreementsCode`}
            options={options?.tradeAgreements ?? []}
            placeholder="NCPTI"
          />
          <Input label="End use code" {...register(`${basePath}.endUseOfItem`)} />
          <Input label="Packages for item" type="number" {...register(`${basePath}.totalPackage`)} />
        </div>
        <Disclosure title="AR4 / excise details">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="AR4 number" {...register(`${basePath}.ar4Number`)} />
            <Input label="AR4 date" type={inputDateType} {...register(`${basePath}.ar4Date`)} />
          </div>
        </Disclosure>
      </Disclosure>
    </div>
  )
}
