import { documentCodes } from '@/data/e-sanchit-codes'
import { quantityCodes } from '@/data/quantity-code'
import schemeCodes from '@/data/scheme-codes'
import { stateOptions } from '@/data/states'
import { Trades } from '@/data/trade-agrements'
import { cargoOptions, contractTypes, paymentTypes, priceInclusionTypes, sealTypes, weightUnits } from '@/data/types'
import { routes } from '@/shared/route-paths'
import { useFieldArray } from 'core/form'
import { Form } from 'core/form/components'
import { navigate, useParams } from 'core/routing'
import { toast } from 'core/toast-manager'
import { RrCaretDown } from 'icons/rr/fi-rr-caret-down'
import { useEffect, useRef, useState } from 'react'
import { Button } from 'ui/basic/button'
import { Card, CardContent, CardHeader } from 'ui/basic/card'
import type { Path } from 'ui/form'
import { getFormContext, RegisterOptions, useController } from 'ui/form'
import { Checkbox } from 'ui/inputs/checkbox'
import { InputError } from 'ui/inputs/error'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { Popover, PopoverContent, PopoverTrigger } from 'ui/interactive/popover'
import { PopoverContext } from 'ui/interactive/popover-context'
import { Tabs, TabsList, TabsTrigger } from 'ui/interactive/tabs'
import { clsx, getContext } from 'ui/utils'
import { useMarksAndNumbers } from './hooks/use-marks-and-numbers'
import { BillFormContext, useShippingBillForm } from './hooks/use-shipping-bill-form'
import {
  BillInvoiceForm,
  Branch,
  Business,
  emptyDocument,
  emptyInvoice,
  emptyItem,
  Exporter,
  invoiceTotal,
  lineTotal,
  portCountry,
  ports,
  SavedBill,
  ShippingBillFormValues
} from './model'
import { BranchDialog, PartyDialog } from './party-dialogs'
import { partyMockService } from './services/party-mock-service'
import { shippingBillService } from './services/shipping-bill-service'
import { getDemoData, saveBill, useDemoData } from './store/demo-store'
import { workflowSteps } from './workflow'

interface QuickAdd {
  kind: 'exporter' | 'business'
  role?: 'consignee' | 'buyer' | 'thirdParty' | 'itemThirdParty'
  invoiceIndex?: number
  itemIndex?: number
}

type BranchPath =
  | 'exporterBranchId'
  | 'consigneeBranchId'
  | `invoices.${number}.buyerBranchId`
  | `invoices.${number}.thirdPartyBranchId`
  | `invoices.${number}.items.${number}.itemThirdPartyBranchId`

interface QuickBranch {
  kind: 'exporter' | 'business'
  ownerId: number
  branchName: BranchPath
}

const portOptions = ports.map((port) => ({ value: port.code, label: `${port.name} · ${port.code}` }))

const currencyOptions = ['USD', 'EUR', 'INR', 'AED', 'GBP', 'SGD'].map((value) => ({ value, label: value }))
const dateType = 'date' as 'text'

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-gray-950">{title}</h2>
      {description && <p className="mt-1 text-sm text-gray-800">{description}</p>}
    </div>
  )
}

function Advanced({
  title,
  children,
  open,
  onToggle
}: {
  title: string
  children: React.ReactNode
  open?: boolean
  onToggle?: (isOpen: boolean) => void
}) {
  return (
    <details
      className="group rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all"
      open={open}
      onToggle={(e) => onToggle?.(e.currentTarget.open)}>
      <summary className="hover:text-primary-600 flex cursor-pointer items-center justify-between text-sm font-semibold text-gray-950 select-none">
        <span>{title}</span>
        <span className="text-xs font-normal text-gray-800 transition-transform group-open:rotate-180">▼</span>
      </summary>
      <div className="mt-4 border-t border-gray-200 pt-3">{children}</div>
    </details>
  )
}

interface PersistentTabProps {
  value: string
  activeTab: string
  children: React.ReactNode
  className?: string
}

// Keep fields registered while another tab is open so RHF validates the entire bill on submit.
function PersistentTab({ value, activeTab, children, className }: PersistentTabProps) {
  return (
    <div role="tabpanel" hidden={activeTab !== value} className={`mt-3 ${className}`}>
      {children}
    </div>
  )
}

interface AsyncOption {
  value: string
  label: string
  sublabel?: string
}

interface AsyncPartySelectProps {
  name: string
  placeholder?: string
  disabled?: boolean
  className?: string
  rules?: RegisterOptions
  deps?: React.DependencyList
  fetchOptions: (query: string) => Promise<AsyncOption[]>
  getInitialLabel?: (id: string) => Promise<string>
}

function AsyncPartySelect({
  name,
  placeholder = 'Search...',
  disabled = false,
  className,
  rules,
  deps = [],
  fetchOptions,
  getInitialLabel
}: AsyncPartySelectProps) {
  const ctx = getFormContext()
  const {
    field: { onChange, value, ref }
  } = useController({
    name,
    control: ctx.hooks.control,
    rules: ctx.schema.shape[name] ?? rules,
    disabled
  })

  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<AsyncOption[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const fetchOptionsRef = useRef(fetchOptions)
  fetchOptionsRef.current = fetchOptions

  const getInitialLabelRef = useRef(getInitialLabel)
  getInitialLabelRef.current = getInitialLabel

  // Fetch label when selected value changes or on mount
  useEffect(() => {
    let active = true
    if (value) {
      if (getInitialLabelRef.current) {
        void getInitialLabelRef.current(String(value)).then((lbl: string) => {
          if (active && lbl) setSelectedLabel(lbl)
        })
      } else {
        const found = options.find((o) => o.value === String(value))
        if (found) setSelectedLabel(found.label)
      }
    } else {
      setSelectedLabel('')
    }
    return () => {
      active = false
    }
  }, [value, ...deps])

  // Fetch search results asynchronously whenever query changes or popover opens
  useEffect(() => {
    if (!isOpen && !query) return

    let active = true
    setLoading(true)
    const timer = setTimeout(() => {
      void fetchOptionsRef
        .current(query)
        .then((results: AsyncOption[]) => {
          if (active) {
            setOptions(results)
            setLoading(false)
          }
        })
        .catch(() => {
          if (active) {
            setOptions([])
            setLoading(false)
          }
        })
    }, 200)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query, isOpen, ...deps])

  return (
    <div>
      <input type="hidden" name={name} value={value ?? ''} ref={ref} disabled={disabled} />
      <Popover placement="bottom-start" fallbackPlacements={['top-start']} onOpenCallback={(open) => setIsOpen(open)}>
        <PopoverTrigger
          className={clsx(
            'outline-focus-select group flex w-full cursor-pointer items-center justify-between rounded border border-gray-200 bg-inherit pr-2 hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          disabled={disabled}>
          <div className="flex items-center p-2 text-sm">
            <span className={selectedLabel ? 'font-semibold text-gray-950' : 'text-gray-800'}>
              {selectedLabel || placeholder}
            </span>
          </div>
          <RrCaretDown className="size-4 text-gray-800 transition-transform group-data-[state=open]:rotate-180" />
        </PopoverTrigger>
        <InputError<ShippingBillFormValues> name={name as Path<ShippingBillFormValues>} />
        <PopoverContent className="overflow-hidden rounded-md border border-gray-200 shadow-lg">
          <div className="border-b border-gray-100 p-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search..."
              className="focus:border-primary-500 focus:ring-primary-500 w-full rounded border border-gray-200 bg-inherit px-2.5 py-1.5 text-sm text-gray-950 outline-none placeholder:text-gray-800 focus:ring-1"
              autoFocus
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {loading ? (
              <div className="p-3 text-center text-xs text-gray-800">Searching mock service...</div>
            ) : options.length === 0 ? (
              <div className="p-3 text-center text-xs text-gray-800">No matching results found</div>
            ) : (
              options.map((opt) => (
                <PopoverOptionItem
                  key={opt.value}
                  option={opt}
                  isSelected={String(value) === opt.value}
                  onSelect={(selected) => {
                    onChange(selected.value)
                    ctx.hooks.setValue(name, selected.value, {
                      shouldValidate: true,
                      shouldDirty: true,
                      shouldTouch: true
                    })
                    setSelectedLabel(selected.label)
                    setQuery('')
                  }}
                />
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function PopoverOptionItem({
  option,
  isSelected,
  onSelect
}: {
  option: AsyncOption
  isSelected: boolean
  onSelect: (opt: AsyncOption) => void
}) {
  const { setOpen } = getContext(PopoverContext)

  return (
    <div
      onClick={() => {
        onSelect(option)
        setOpen(false)
      }}
      className={clsx(
        'flex cursor-pointer flex-col rounded p-2 text-sm transition-colors',
        isSelected ? 'bg-primary-600 font-semibold text-white' : 'text-gray-950 hover:bg-gray-100'
      )}>
      <span>{option.label}</span>
      {option.sublabel && <span className="text-xs text-gray-800">{option.sublabel}</span>}
    </div>
  )
}

function PartyFields({
  formCtx,
  ownerName,
  branchName,
  label,
  kind,
  parties,
  required = true,
  onAddBranch,
  onQuickAdd
}: {
  formCtx: BillFormContext
  ownerName:
    | 'exporterId'
    | 'consigneeId'
    | `invoices.${number}.buyerId`
    | `invoices.${number}.thirdPartyId`
    | `invoices.${number}.items.${number}.itemThirdPartyId`
  branchName: BranchPath
  label: string
  kind: 'exporter' | 'business'
  parties: (Exporter | Business)[]
  required?: boolean
  onAddBranch: (ownerId: number) => void
  onQuickAdd: () => void
}) {
  const ownerId = formCtx.hooks.watch(ownerName)
  const { exporters, businesses } = getDemoData()
  const owner =
    kind === 'exporter'
      ? (exporters.find((party) => String(party.id) === ownerId) ??
        parties.find((party) => String(party.id) === ownerId))
      : (businesses.find((party) => String(party.id) === ownerId) ??
        parties.find((party) => String(party.id) === ownerId))

  useEffect(() => {
    const selectedBranch = formCtx.hooks.getValues(branchName)
    if (
      selectedBranch &&
      owner &&
      owner.branches.length > 0 &&
      !owner.branches.some((branch) => String(branch.id) === selectedBranch)
    ) {
      formCtx.hooks.setValue(branchName, '', { shouldValidate: true })
    }
  }, [branchName, formCtx.hooks, owner])

  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-gray-950">{label}</span>
          <button
            type="button"
            className="text-primary-700 dark:text-primary-400 text-xs font-semibold hover:underline"
            onClick={onQuickAdd}>
            + Add new
          </button>
        </div>
        <AsyncPartySelect
          name={ownerName}
          placeholder={`Search & select ${kind}...`}
          rules={{ required }}
          fetchOptions={async (query) => {
            if (kind === 'exporter') {
              const res = await partyMockService.searchExporters(query)
              return res.map((item) => ({
                value: String(item.id),
                label: item.name,
                sublabel: item.iec ? `IEC: ${item.iec}` : undefined
              }))
            } else {
              const res = await partyMockService.searchConsignees(query)
              return res.map((item) => ({
                value: String(item.id),
                label: item.name
              }))
            }
          }}
          getInitialLabel={async (id) => {
            if (kind === 'exporter') {
              const item = await partyMockService.getExporterById(id)
              return item ? item.name : ''
            } else {
              const item = await partyMockService.getConsigneeById(id)
              return item ? item.name : ''
            }
          }}
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-gray-950">Branch / address</span>
          {owner && (
            <button
              type="button"
              className="text-primary-700 dark:text-primary-400 text-xs font-semibold hover:underline"
              onClick={() => onAddBranch(owner.id)}>
              + Add branch
            </button>
          )}
        </div>
        <AsyncPartySelect
          name={branchName}
          placeholder={owner ? 'Search & select branch...' : `Choose ${kind} first`}
          disabled={!owner}
          rules={{ required: required || !!ownerId }}
          deps={[ownerId]}
          fetchOptions={async (query) => {
            if (!ownerId) return []
            if (kind === 'exporter') {
              const res = await partyMockService.searchExporterBranches(ownerId, query)
              return res.map((branch) => ({
                value: String(branch.id),
                label: `${branch.branchName} · ${branch.city}`,
                sublabel: branch.address1
              }))
            } else {
              const res = await partyMockService.searchConsigneeBranches(ownerId, query)
              return res.map((branch) => ({
                value: String(branch.id),
                label: `${branch.branchName} · ${branch.city}`,
                sublabel: branch.address1
              }))
            }
          }}
          getInitialLabel={async (id) => {
            const branch = owner?.branches.find((b) => String(b.id) === id)
            return branch ? `${branch.branchName} · ${branch.city}` : ''
          }}
        />
      </div>
    </div>
  )
}

function InvoiceEditor({
  formCtx,
  index,
  invoice,
  businesses,
  onQuickAdd,
  onAddBranch,
  onRemove,
  canRemove
}: {
  formCtx: BillFormContext
  index: number
  invoice: BillInvoiceForm
  businesses: Business[]
  onQuickAdd: (role: 'buyer' | 'thirdParty' | 'itemThirdParty', invoiceIndex: number, itemIndex?: number) => void
  onAddBranch: (ownerId: number, branchName: BranchPath) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const { register, control, watch } = formCtx.hooks
  const invoiceValues = watch(`invoices.${index}`)
  const {
    fields: items,
    append: addItem,
    remove: removeItem
  } = useFieldArray({ control, name: `invoices.${index}.items` })
  const buyerSame = formCtx.hooks.watch(`invoices.${index}.buyerSameAsConsignee`)
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
              {invoiceValues.currency || 'USD'} ·{' '}
              {contractTypes.find((c) => c.value === invoiceValues.contractType)?.label ||
                invoiceValues.contractType ||
                'FOB'}
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
          <Input label="Invoice date" type={dateType} {...register(`invoices.${index}.invoiceDate`)} />
          <div className="flex gap-2">
            <div className="w-[100px] shrink-0">
              <Select<ShippingBillFormValues>
                label="Currency"
                name={`invoices.${index}.currency`}
                options={currencyOptions}
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
            options={contractTypes}
            rules={{ required: true }}
          />
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-gray-950">
            <Checkbox {...register(`invoices.${index}.buyerSameAsConsignee`)} />
            Buyer & consignee are same
          </label>
        </div>
        {!buyerSame && (
          <PartyFields
            formCtx={formCtx}
            ownerName={`invoices.${index}.buyerId`}
            branchName={`invoices.${index}.buyerBranchId`}
            label="Buyer"
            kind="business"
            parties={buyerOptions}
            onQuickAdd={() => onQuickAdd('buyer', index)}
            onAddBranch={(ownerId) => onAddBranch(ownerId, `invoices.${index}.buyerBranchId`)}
          />
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-gray-950">Charges & Deductions</h4>
              <p className="text-xs text-gray-800">
                Specify rate % or amount for freight, insurance, and other adjustments.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 divide-y divide-gray-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              {/* Left Column: Freight, Commission, Other Deductions */}
              <div className="divide-y divide-gray-200 p-2 sm:p-3">
                {/* Freight */}
                <div className="py-2.5">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-950">Freight</span>
                    <span className="text-[11px] font-medium text-gray-800">Rate or Amount</span>
                  </div>
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-4">
                      <div className="relative">
                        <Input
                          type="number"
                          {...register(`invoices.${index}.freightRate`)}
                          className="pr-6 text-right"
                          disabled={invoiceValues.freightAmount !== '' && invoiceValues.freightAmount != null}
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
                        {...register(`invoices.${index}.freightAmount`)}
                        className="text-right"
                        disabled={invoiceValues.freightRate !== '' && invoiceValues.freightRate != null}
                        placeholder="Amount"
                      />
                    </div>
                    <div className="col-span-3">
                      <Select<ShippingBillFormValues>
                        name={`invoices.${index}.freightCurrency`}
                        options={currencyOptions}
                        placeholder={invoice.currency}
                      />
                    </div>
                  </div>
                </div>

                {/* Commission */}
                <div className="py-2.5">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-950">Commission</span>
                    <span className="text-[11px] font-medium text-gray-800">Rate or Amount</span>
                  </div>
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-4">
                      <div className="relative">
                        <Input
                          type="number"
                          {...register(`invoices.${index}.commissionRate`)}
                          className="pr-6 text-right"
                          disabled={invoiceValues.commissionAmount !== '' && invoiceValues.commissionAmount != null}
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
                        {...register(`invoices.${index}.commissionAmount`)}
                        className="text-right"
                        disabled={invoiceValues.commissionRate !== '' && invoiceValues.commissionRate != null}
                        placeholder="Amount"
                      />
                    </div>
                    <div className="col-span-3">
                      <Select<ShippingBillFormValues>
                        name={`invoices.${index}.commissionCurrency`}
                        options={currencyOptions}
                        placeholder={invoice.currency}
                      />
                    </div>
                  </div>
                </div>

                {/* Other Deductions */}
                <div className="pt-2.5">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-950">Other Deductions</span>
                    <span className="text-[11px] font-medium text-gray-800">Rate or Amount</span>
                  </div>
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-4">
                      <div className="relative">
                        <Input
                          type="number"
                          {...register(`invoices.${index}.otherDeductionsRate`)}
                          className="pr-6 text-right"
                          disabled={
                            invoiceValues.otherDeductionsAmount !== '' && invoiceValues.otherDeductionsAmount != null
                          }
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
                        {...register(`invoices.${index}.otherDeductionsAmount`)}
                        className="text-right"
                        disabled={invoiceValues.otherDeductionsRate !== '' && invoiceValues.otherDeductionsRate != null}
                        placeholder="Amount"
                      />
                    </div>
                    <div className="col-span-3">
                      <Select<ShippingBillFormValues>
                        name={`invoices.${index}.otherDeductionsCurrency`}
                        options={currencyOptions}
                        placeholder={invoice.currency}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Insurance, Discount, Packing Charges */}
              <div className="divide-y divide-gray-200 p-2 sm:p-3">
                {/* Insurance */}
                <div className="py-2.5">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-950">Insurance</span>
                    <span className="text-[11px] font-medium text-gray-800">Rate or Amount</span>
                  </div>
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-4">
                      <div className="relative">
                        <Input
                          type="number"
                          {...register(`invoices.${index}.insuranceRate`)}
                          className="pr-6 text-right"
                          disabled={invoiceValues.insuranceAmount !== '' && invoiceValues.insuranceAmount != null}
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
                        {...register(`invoices.${index}.insuranceAmount`)}
                        className="text-right"
                        disabled={invoiceValues.insuranceRate !== '' && invoiceValues.insuranceRate != null}
                        placeholder="Amount"
                      />
                    </div>
                    <div className="col-span-3">
                      <Select<ShippingBillFormValues>
                        name={`invoices.${index}.insuranceCurrency`}
                        options={currencyOptions}
                        placeholder={invoice.currency}
                      />
                    </div>
                  </div>
                </div>

                {/* Discount */}
                <div className="py-2.5">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-950">Discount</span>
                    <span className="text-[11px] font-medium text-gray-800">Rate or Amount</span>
                  </div>
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-4">
                      <div className="relative">
                        <Input
                          type="number"
                          {...register(`invoices.${index}.discountRate`)}
                          className="pr-6 text-right"
                          disabled={invoiceValues.discountAmount !== '' && invoiceValues.discountAmount != null}
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
                        {...register(`invoices.${index}.discountAmount`)}
                        className="text-right"
                        disabled={invoiceValues.discountRate !== '' && invoiceValues.discountRate != null}
                        placeholder="Amount"
                      />
                    </div>
                    <div className="col-span-3">
                      <Select<ShippingBillFormValues>
                        name={`invoices.${index}.discountCurrency`}
                        options={currencyOptions}
                        placeholder={invoice.currency}
                      />
                    </div>
                  </div>
                </div>

                {/* Packing Charges */}
                <div className="pt-2.5">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-950">Packing Charges</span>
                    <span className="text-[11px] font-medium text-gray-800">Flat Amount</span>
                  </div>
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-9">
                      <Input
                        type="number"
                        {...register(`invoices.${index}.packingCharges`)}
                        className="text-right"
                        placeholder="Amount"
                      />
                    </div>
                    <div className="col-span-3 flex items-center justify-center">
                      <span className="text-xs font-semibold text-gray-800">{invoice.currency || 'USD'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select<ShippingBillFormValues>
            label="Price includes"
            name={`invoices.${index}.freightInsuranceIncluded`}
            options={priceInclusionTypes}
            placeholder="Select if applicable"
          />
          <Input label="Contract / order number" {...register(`invoices.${index}.contractNumber`)} />
          <Select<ShippingBillFormValues>
            label="Payment type"
            name={`invoices.${index}.natureOfPayment`}
            options={paymentTypes}
            placeholder="Select if applicable"
          />
          <Input label="Payment period (days)" type="number" {...register(`invoices.${index}.periodOfPayment`)} />
        </div>
        <PartyFields
          formCtx={formCtx}
          ownerName={`invoices.${index}.thirdPartyId`}
          branchName={`invoices.${index}.thirdPartyBranchId`}
          label="Third party (optional)"
          kind="business"
          parties={thirdPartyOptions}
          required={false}
          onQuickAdd={() => onQuickAdd('thirdParty', index)}
          onAddBranch={(ownerId) => onAddBranch(ownerId, `invoices.${index}.thirdPartyBranchId`)}
        />

        <div className="border-t border-gray-200 pt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-950">Goods & Line Items ({items.length})</h3>
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
                <div key={field.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary-600 flex size-6 items-center justify-center rounded-md text-xs font-bold text-white shadow-xs">
                        {itemIndex + 1}
                      </span>
                      <h4 className="text-sm font-bold text-gray-950">
                        Item {itemIndex + 1} {item.goodsDescription1 ? `— ${item.goodsDescription1.slice(0, 30)}` : ''}
                      </h4>
                    </div>
                    {items.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        className="text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => removeItem(itemIndex)}>
                        Remove item
                      </Button>
                    )}
                  </div>
                  <div className="mb-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                    <Input
                      label="RITC / HS code"
                      {...register(`invoices.${index}.items.${itemIndex}.ritcCode`)}
                      placeholder="e.g. 61091000"
                    />
                    <Select<ShippingBillFormValues>
                      label="Scheme code"
                      name={`invoices.${index}.items.${itemIndex}.schemeCode`}
                      options={schemeCodes}
                      placeholder="Select scheme"
                    />
                    <Input
                      label="Goods description"
                      {...register(`invoices.${index}.items.${itemIndex}.goodsDescription1`)}
                      wrapClass="lg:col-span-4"
                      placeholder="e.g. Cotton T-shirts"
                    />
                    <Input
                      label="Quantity"
                      type="number"
                      {...register(`invoices.${index}.items.${itemIndex}.quantity`)}
                    />
                    <Select<ShippingBillFormValues>
                      label="Unit"
                      name={`invoices.${index}.items.${itemIndex}.unitOfMeasurement`}
                      options={quantityCodes}
                      rules={{ required: true }}
                    />
                    <Input
                      label={`Unit price (${invoice.currency || 'currency'})`}
                      type="number"
                      {...register(`invoices.${index}.items.${itemIndex}.unitPrice`)}
                    />
                    <Input
                      label="Item Total"
                      type="number"
                      placeholder={`${invoice.currency} ${lineTotal(item).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}

                      {...register(`invoices.${index}.items.${itemIndex}.lineTotal`)}
                    />
                    <Select<ShippingBillFormValues>
                      label="IGST payment"
                      name={`invoices.${index}.items.${itemIndex}.igstPaymentStatus`}
                      options={[
                        { value: 'NA', label: 'Not applicable' },
                        { value: 'LUT', label: 'Under LUT / bond' },
                        { value: 'P', label: 'Against payment' }
                      ]}
                      placeholder="Select if applicable"
                    />
                  </div>
                  {/* Row 3: drawback inputs (conditional) + checkboxes */}
                  <div className="mb-3 flex flex-wrap items-end gap-4">
                    {(() => {
                      const selectedScheme = schemeCodes.find((s) => s.value === item.schemeCode)
                      const showDrawback =
                        selectedScheme &&
                        (selectedScheme.drawback === true ||
                          selectedScheme.RODTEP === true ||
                          selectedScheme.ROSCTL === true)
                      return showDrawback ? (
                        <>
                          <div className="w-36">
                            <Input
                              label="Drawback Serial no."
                              {...register(`invoices.${index}.items.${itemIndex}.drawbackSerialNumber`)}
                            />
                          </div>
                          <div className="w-32">
                            <Input
                              label="Drawback Unit"
                              {...register(`invoices.${index}.items.${itemIndex}.drawbackUnit`)}
                            />
                          </div>
                          <div className="w-36">
                            <Input
                              label="Drawback Quantity"
                              type="number"
                              {...register(`invoices.${index}.items.${itemIndex}.drawbackQuantity`)}
                            />
                          </div>
                        </>
                      ) : null
                    })()}
                    <label className="flex items-center gap-2 pb-1 text-sm">
                      <Checkbox {...register(`invoices.${index}.items.${itemIndex}.rewardItem`)} />
                      Claim reward
                    </label>
                    <label className="flex items-center gap-2 pb-1 text-sm">
                      <Checkbox {...register(`invoices.${index}.items.${itemIndex}.thirdPartyItem`)} />
                      Third-party item
                    </label>
                  </div>
                  {item.thirdPartyItem && (
                    <div className="my-4">
                      <PartyFields
                        formCtx={formCtx}
                        ownerName={`invoices.${index}.items.${itemIndex}.itemThirdPartyId`}
                        branchName={`invoices.${index}.items.${itemIndex}.itemThirdPartyBranchId`}
                        label="Item third party"
                        kind="business"
                        parties={businesses.filter(
                          (business) => business.isThirdParty || business.id === Number(item.itemThirdPartyId)
                        )}
                        onQuickAdd={() => onQuickAdd('itemThirdParty', index, itemIndex)}
                        onAddBranch={(ownerId) =>
                          onAddBranch(ownerId, `invoices.${index}.items.${itemIndex}.itemThirdPartyBranchId`)
                        }
                      />
                    </div>
                  )}
                  <Advanced title="Item customs, taxes and incentives">
                    <div className="mb-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <Select<ShippingBillFormValues>
                        label="Unit of rate"
                        {...register(`invoices.${index}.items.${itemIndex}.unitOfRate`)}
                        options={quantityCodes}
                        placeholder={invoice.items[index].unitOfMeasurement}
                      />
                      <Input
                        label="Per Unit (Rate)"
                        type="number"
                        placeholder="1"
                        {...register(`invoices.${index}.items.${itemIndex}.numberOfUnits`)}
                      />
                      <Input
                        label="Present market value"
                        type="number"
                        {...register(`invoices.${index}.items.${itemIndex}.presentMarketValue`)}
                      />
                      <Input label="GCess" type="number" {...register(`invoices.${index}.items.${itemIndex}.cess`)} />
                      <Input
                        label="Accessories description"
                        wrapClass="lg:col-span-3"
                        {...register(`invoices.${index}.items.${itemIndex}.accessoriesDescription`)}
                      />
                      <Select<ShippingBillFormValues>
                        label="Accessory status"
                        name={`invoices.${index}.items.${itemIndex}.accessoryStatus`}
                        options={[
                          { value: '0', label: 'No accessory' },
                          { value: '1', label: 'Included free of cost' },
                          { value: '2', label: 'Entered separately' }
                        ]}
                        placeholder="Select if relevant"
                      />
                      {item.igstPaymentStatus === 'P' && (
                        <>
                          <Input
                            label="Taxable value"
                            type="number"
                            {...register(`invoices.${index}.items.${itemIndex}.taxableValue`)}
                          />
                          <Input
                            label="IGST amount"
                            type="number"
                            {...register(`invoices.${index}.items.${itemIndex}.igstAmount`)}
                          />
                        </>
                      )}

                      <Input
                        label="Origin district code"
                        {...register(`invoices.${index}.items.${itemIndex}.originDistrictCode`)}
                      />
                      <Select<ShippingBillFormValues>
                        label="Trade agreement code"
                        name={`invoices.${index}.items.${itemIndex}.tradeAgreementsCode`}
                        options={Trades}
                        placeholder="NCPTI"
                      />
                      <Input label="End use code" {...register(`invoices.${index}.items.${itemIndex}.endUseOfItem`)} />
                      <Input
                        label="Packages for item"
                        type="number"
                        {...register(`invoices.${index}.items.${itemIndex}.totalPackage`)}
                      />
                    </div>
                    <Advanced title="AR4 / excise details">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Input label="AR4 number" {...register(`invoices.${index}.items.${itemIndex}.ar4Number`)} />
                        <Input
                          label="AR4 date"
                          type={dateType}
                          {...register(`invoices.${index}.items.${itemIndex}.ar4Date`)}
                        />
                      </div>
                    </Advanced>
                  </Advanced>
                </div>
              )
            })}
          </div>
        </div>

        <div className="text-right text-sm font-semibold">
          Invoice total: {invoice.currency}{' '}
          {invoiceTotal(invoice).toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
      </CardContent>
    </Card>
  )
}

function DocumentItem({ formCtx, index, onRemove }: { formCtx: BillFormContext; index: number; onRemove: () => void }) {
  const { register, watch } = formCtx.hooks
  const documentValues = watch(`documents.${index}`)

  const hasCustomValues = Boolean(
    documentValues?.placeOfIssue ||
    documentValues?.invoiceSerialNumber ||
    documentValues?.itemSerialNumber ||
    documentValues?.issuingPartyCode ||
    documentValues?.issuingPartyName ||
    documentValues?.issuingPartyAddress1 ||
    documentValues?.issuingPartyAddress2 ||
    documentValues?.issuingPartyCity ||
    documentValues?.issuingPartyPin ||
    documentValues?.beneficiaryPartyCode ||
    documentValues?.beneficiaryPartyName ||
    documentValues?.beneficiaryPartyAddress1 ||
    documentValues?.beneficiaryPartyAddress2 ||
    documentValues?.beneficiaryPartyCity ||
    documentValues?.beneficiaryPartyPin ||
    documentValues?.fileType ||
    documentValues?.icegateId
  )

  const [showCustomDetails, setShowCustomDetails] = useState(hasCustomValues)

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-950">Document {index + 1}</h3>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onRemove}>
          Remove
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <span className="mb-1 block text-sm font-medium text-gray-800">Document type code</span>
          <AsyncPartySelect
            name={`documents.${index}.documentTypeCode`}
            placeholder="Search document type..."
            fetchOptions={async (query) => {
              const q = query.toLowerCase().trim()
              const filtered = documentCodes.filter(
                (doc) => doc.label.toLowerCase().includes(q) || doc.value.toLowerCase().includes(q)
              )
              return filtered.map((doc) => ({
                value: doc.value,
                label: doc.label
              }))
            }}
            getInitialLabel={async (val) => {
              const found = documentCodes.find((doc) => doc.value === val || doc.label === val)
              return found ? found.label : val
            }}
          />
        </div>
        <Input label="Image reference number" {...register(`documents.${index}.imageReferenceNumber`)} />
        <Input label="Issue date" type={dateType} {...register(`documents.${index}.documentIssueDate`)} />
      </div>
      <Advanced
        title="Issuing party and ICEGATE details"
        open={showCustomDetails}
        onToggle={(isOpen) => setShowCustomDetails(isOpen)}>
        <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Reference number" {...register(`documents.${index}.documentReferenceNumber`)} />
          <Input label="Expiry date" type={dateType} {...register(`documents.${index}.documentExpiryDate`)} />
          <Input label="Invoice serial number" type="number" {...register(`documents.${index}.invoiceSerialNumber`)} />
          <Input label="Item serial number" type="number" {...register(`documents.${index}.itemSerialNumber`)} />
          <div>
            <span className="mb-1 block text-sm font-medium text-gray-800">File type</span>
            <AsyncPartySelect
              name={`documents.${index}.fileType`}
              placeholder="Search file type..."
              className="bg-transparent"
              fetchOptions={async (query) => {
                const q = query.toLowerCase().trim()
                const options = [{ value: 'pdf', label: 'PDF' }]
                return options.filter(
                  (doc) => doc.label.toLowerCase().includes(q) || doc.value.toLowerCase().includes(q)
                )
              }}
              getInitialLabel={async (val) => {
                const found = [{ value: 'pdf', label: 'PDF' }].find((doc) => doc.value === val || doc.label === val)
                return found ? found.label : val
              }}
            />
          </div>
          <Input label="Place of issue" {...register(`documents.${index}.placeOfIssue`)} />
        </div>

        <div className="flex flex-col gap-4">
          <Advanced title="Issuing & Beneficiary">
            <div className="flex flex-col gap-6 pt-2">
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-950">Issuing Details</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Input label="Issuing party code" {...register(`documents.${index}.issuingPartyCode`)} />
                  <Input label="Issuing party name" {...register(`documents.${index}.issuingPartyName`)} />
                  <Input label="Issuing address line 1" {...register(`documents.${index}.issuingPartyAddress1`)} />
                  <Input label="Issuing address line 2" {...register(`documents.${index}.issuingPartyAddress2`)} />
                  <Input label="Issuing city" {...register(`documents.${index}.issuingPartyCity`)} />
                  <Input label="Issuing postal code" {...register(`documents.${index}.issuingPartyPin`)} />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <h3 className="mb-3 text-sm font-semibold text-gray-950">Beneficiary Details</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Input label="Beneficiary code" {...register(`documents.${index}.beneficiaryPartyCode`)} />
                  <Input label="Beneficiary name" {...register(`documents.${index}.beneficiaryPartyName`)} />
                  <Input
                    label="Beneficiary address line 1"
                    {...register(`documents.${index}.beneficiaryPartyAddress1`)}
                  />
                  <Input
                    label="Beneficiary address line 2"
                    {...register(`documents.${index}.beneficiaryPartyAddress2`)}
                  />
                  <Input label="Beneficiary city" {...register(`documents.${index}.beneficiaryPartyCity`)} />
                  <Input label="Beneficiary postal code" {...register(`documents.${index}.beneficiaryPartyPin`)} />
                </div>
              </div>
            </div>
          </Advanced>
        </div>
      </Advanced>
    </div>
  )
}

function BillEditor({ bill }: { bill?: SavedBill }) {
  const { exporters, businesses } = useDemoData()
  const {
    formCtx,
    values,
    setValue,
    invoices: { fields: invoices, append: addInvoice, remove: removeInvoice },
    containers: { fields: containers, append: addContainer, remove: removeContainer },
    packingRanges: { fields: packingRanges, append: addPackingRange, remove: removePackingRange },
    documents: { fields: documents, append: addDocument, remove: removeDocument },
    licenses: { fields: licenses, append: addLicense, remove: removeLicense },
    activeTab,
    setActiveTab,
    draftId,
    setDraftId
  } = useShippingBillForm(bill)
  const { register } = formCtx.hooks
  const [quickAdd, setQuickAdd] = useState<QuickAdd | null>(null)
  const [quickBranch, setQuickBranch] = useState<QuickBranch | null>(null)
  const { options: marksAndNumbersOptions, isLoading: marksAndNumbersLoading } = useMarksAndNumbers(
    values.exporterId,
    setValue
  )
  const consigneeOptions = businesses.filter(
    (business) => business.isConsignee || String(business.id) === values.consigneeId
  )

  async function handleSave(data: ShippingBillFormValues) {
    try {
      const saved = saveBill(data, draftId)
      setDraftId(saved.id)
      console.log('Shipping bill save payload', saved.payload)

      // Submit payload to backend API (POST /api/shipping-bills from shipping_bill.http)
      try {
        const apiResult = await shippingBillService.upsert(data)
        console.log('API response from POST /api/shipping-bills:', apiResult)
      } catch (apiErr) {
        console.log('Backend API sync notice (saved locally):', apiErr)
      }

      toast.success(bill ? 'Shipping bill updated' : 'Shipping bill created')
      navigate(routes.toShippingBillEdit(saved.id))
    } catch (err: any) {
      console.error('Error saving shipping bill:', err)
      toast.error('Failed to save shipping bill')
    }
  }

  function handleQuickSaved(party: Exporter | Business) {
    const branchId = party.branches[0]?.id
    if (!quickAdd || !branchId) return
    if (quickAdd.kind === 'exporter') {
      setValue('exporterId', String(party.id), { shouldValidate: true })
      setValue('exporterBranchId', String(branchId), { shouldValidate: true })
    } else if (quickAdd.role === 'consignee') {
      setValue('consigneeId', String(party.id), { shouldValidate: true })
      setValue('consigneeBranchId', String(branchId), { shouldValidate: true })
    } else if (quickAdd.role === 'itemThirdParty' && quickAdd.invoiceIndex != null && quickAdd.itemIndex != null) {
      setValue(`invoices.${quickAdd.invoiceIndex}.items.${quickAdd.itemIndex}.itemThirdPartyId`, String(party.id), {
        shouldValidate: true
      })
      setValue(
        `invoices.${quickAdd.invoiceIndex}.items.${quickAdd.itemIndex}.itemThirdPartyBranchId`,
        String(branchId),
        { shouldValidate: true }
      )
    } else if (quickAdd.invoiceIndex != null) {
      const field = quickAdd.role === 'buyer' ? 'buyer' : 'thirdParty'
      setValue(`invoices.${quickAdd.invoiceIndex}.${field}Id`, String(party.id), { shouldValidate: true })
      setValue(`invoices.${quickAdd.invoiceIndex}.${field}BranchId`, String(branchId), { shouldValidate: true })
    }
  }

  return (
    <div className="space-y-6">
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
                Draft #{bill.values.jobNumber || bill.id}
              </span>
            </div>
          )}
        </div>
      </div>
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
      <Form ctx={formCtx} handleSubmit={handleSave} className="space-y-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(String(value))}>
          <TabsList className="flex w-full justify-start gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-1.5">
            <TabsTrigger
              value="details"
              className="rounded-lg px-4 py-2 text-sm font-bold transition-all hover:text-gray-950 aria-[selected=false]:text-gray-800 aria-[selected=true]:bg-white aria-[selected=true]:text-gray-950 aria-[selected=true]:shadow-xs dark:aria-[selected=true]:bg-gray-200">
              1. Details
            </TabsTrigger>
            <TabsTrigger
              value="invoices"
              className="rounded-lg px-4 py-2 text-sm font-bold transition-all hover:text-gray-950 aria-[selected=false]:text-gray-800 aria-[selected=true]:bg-white aria-[selected=true]:text-gray-950 aria-[selected=true]:shadow-xs dark:aria-[selected=true]:bg-gray-200">
              2. Invoices & goods
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="rounded-lg px-4 py-2 text-sm font-bold transition-all hover:text-gray-950 aria-[selected=false]:text-gray-800 aria-[selected=true]:bg-white aria-[selected=true]:text-gray-950 aria-[selected=true]:shadow-xs dark:aria-[selected=true]:bg-gray-200">
              3. Others
            </TabsTrigger>
          </TabsList>

          <PersistentTab value="details" activeTab={activeTab} className="space-y-4">
            <Card>
              <CardHeader title="Shipment basics" description="Parties and route are the core details for this bill." />
              <CardContent className="space-y-5">
                <PartyFields
                  formCtx={formCtx}
                  ownerName="exporterId"
                  branchName="exporterBranchId"
                  label="Exporter"
                  kind="exporter"
                  parties={exporters.filter((item) => !item.disabled || String(item.id) === values.exporterId)}
                  onQuickAdd={() => setQuickAdd({ kind: 'exporter' })}
                  onAddBranch={(ownerId) =>
                    setQuickBranch({ kind: 'exporter', ownerId, branchName: 'exporterBranchId' })
                  }
                />
                <PartyFields
                  formCtx={formCtx}
                  ownerName="consigneeId"
                  branchName="consigneeBranchId"
                  label="Consignee"
                  kind="business"
                  parties={consigneeOptions}
                  onQuickAdd={() => setQuickAdd({ kind: 'business', role: 'consignee' })}
                  onAddBranch={(ownerId) =>
                    setQuickBranch({ kind: 'business', ownerId, branchName: 'consigneeBranchId' })
                  }
                />

                <div className="border-t border-gray-200 pt-5">
                  <SectionHeading title="Route" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <span className="mb-1 block text-sm font-medium">Port of loading</span>
                      <AsyncPartySelect
                        name="loadingPort"
                        placeholder="Select Indian port"
                        rules={{ required: true }}
                        fetchOptions={async (query) => {
                          const res = await partyMockService.searchLoadingPorts(query)
                          return res.map((port) => ({
                            value: port.code,
                            label: `${port.name} · ${port.code}`,
                            sublabel: `Country: ${port.countryCode}`
                          }))
                        }}
                        getInitialLabel={async (code) => {
                          const port = await partyMockService.getPortByCode(code)
                          return port ? `${port.name} · ${port.code}` : code
                        }}
                      />
                    </div>
                    <div>
                      <span className="mb-1 block text-sm font-medium">Final destination port</span>
                      <AsyncPartySelect
                        name="finalDestinationPort"
                        placeholder="Select destination"
                        rules={{ required: true }}
                        fetchOptions={async (query) => {
                          const res = await partyMockService.searchDestinationPorts(query)
                          return res.map((port) => ({
                            value: port.code,
                            label: `${port.name} · ${port.code}`,
                            sublabel: `Country: ${port.countryCode}`
                          }))
                        }}
                        getInitialLabel={async (code) => {
                          const port = await partyMockService.getPortByCode(code)
                          return port ? `${port.name} · ${port.code}` : code
                        }}
                      />
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-gray-800">
                    Countries are derived from the port codes when saved: {portCountry(values.loadingPort) || '—'} →{' '}
                    {portCountry(values.finalDestinationPort) || '—'}.
                  </p>
                </div>
                <Advanced title="Regulatory and route exceptions">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Select<ShippingBillFormValues>
                      label="Discharge port"
                      name="dischargePort"
                      options={portOptions}
                      placeholder="Defaults to destination"
                    />
                    <Select<ShippingBillFormValues>
                      label="Origin state"
                      name="originStateCode"
                      options={stateOptions}
                      placeholder="Defaults to Branch State Code"
                    />
                    <div></div>
                    <Select<ShippingBillFormValues>
                      label="NFEI category"
                      name="nfeiCategory"
                      options={[
                        ['01', 'Free trade sample'],
                        ['02', 'Diplomatic goods'],
                        ['03', 'Warranty replacement'],
                        ['07', 'Gift parcel'],
                        ['08', 'Other']
                      ].map(([value, label]) => ({ value, label }))}
                      placeholder="Not applicable"
                    />
                    <Input label="RBI waiver number" {...register('rbiWaiverNumber')} />
                    <Input label="RBI waiver date" type={dateType} {...register('rbiWaiverDate')} />
                  </div>
                </Advanced>

                <div className="border-t border-gray-200 pt-5">
                  <SectionHeading title="Package Detail" />
                  <div className="grid gap-4 pb-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Select<ShippingBillFormValues>
                      label="Nature of cargo"
                      name="natureOfCargo"
                      options={cargoOptions}
                    />
                    <Input label="Gross weight" type="number" {...register('grossWeight')} />
                    <Input label="Net weight" type="number" {...register('netWeight')} />
                    <Select<ShippingBillFormValues> label="Weight unit" name="measurementUnit" options={weightUnits} />
                    <Input label="Total packages" type="number" {...register('totalPackages')} />
                    <Select<ShippingBillFormValues>
                      label="Marks and numbers"
                      name="marksAndNumbers"
                      options={marksAndNumbersOptions}
                      placeholder={
                        !values.exporterId
                          ? 'Select exporter first'
                          : marksAndNumbersLoading
                            ? 'Loading marks and numbers...'
                            : 'Select marks and numbers'
                      }
                      disabled={!values.exporterId || marksAndNumbersLoading || !marksAndNumbersOptions.length}
                      wrapClass="sm:col-span-3"
                    />
                  </div>
                  <Advanced title="Additional Details">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <Select<ShippingBillFormValues>
                        label="Seal type"
                        name="sealType"
                        options={sealTypes}
                        placeholder="Select if relevant"
                      />
                      {containers.length === 0 && (
                        <Input label="Number of containers" type="number" {...register('numberOfContainers')} />
                      )}
                      <Input label="Loose packets" type="number" {...register('loosePackets')} />
                      <Input label="MAWB number" {...register('mawbNumber')} />
                      <Input label="HAWB number" {...register('hawbNumber')} />
                    </div>
                  </Advanced>
                </div>
              </CardContent>
            </Card>
          </PersistentTab>

          <PersistentTab value="invoices" activeTab={activeTab} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold tracking-tight text-gray-950">Invoices & goods</h2>
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
                formCtx={formCtx}
                index={index}
                invoice={values.invoices[index] ?? emptyInvoice()}
                businesses={businesses}
                onQuickAdd={(role, invoiceIndex, itemIndex) =>
                  setQuickAdd({ kind: 'business', role, invoiceIndex, itemIndex })
                }
                onAddBranch={(ownerId, branchName) => setQuickBranch({ kind: 'business', ownerId, branchName })}
                onRemove={() => removeInvoice(index)}
                canRemove={invoices.length > 1}
              />
            ))}
          </PersistentTab>

          <PersistentTab value="documents" activeTab={activeTab} className="space-y-4">
            <Card>
              <CardHeader title="Cargo & Package Detail" />
              <CardContent className="space-y-5">
                <div className="mb-3 flex items-center justify-between">
                  <SectionHeading
                    title={`Containers (${containers.length})`}
                    description="Add only when the cargo is containerized."
                  />
                  <Button size="sm" variant="outline" onClick={() => addContainer({ containerNumber: '' })}>
                    + Add container
                  </Button>
                </div>
                <div className="space-y-3">
                  {containers.map((field, index) => (
                    <div key={field.id} className="rounded-lg border border-gray-200 p-4">
                      <div className="mb-3 flex justify-between">
                        <h3 className="text-sm font-semibold">Container {index + 1}</h3>
                        <Button size="sm" variant="ghost" onClick={() => removeContainer(index)}>
                          Remove
                        </Button>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Input label="Container number" {...register(`containers.${index}.containerNumber`)} />
                        <Select<ShippingBillFormValues>
                          label="Size"
                          name={`containers.${index}.containerSize`}
                          options={[
                            { value: '20', label: '20 ft' },
                            { value: '40', label: '40 ft' },
                            { value: '45', label: '45 ft' }
                          ]}
                          placeholder="Select size"
                        />
                        <Input label="Seal number" {...register(`containers.${index}.exciseSealNumber`)} />
                        <Input label="Seal date" type={dateType} {...register(`containers.${index}.sealDate`)} />
                        <Select<ShippingBillFormValues>
                          label="Seal type"
                          name={`containers.${index}.sealType`}
                          options={[
                            { value: 1, label: 'BTSL - Bottle Seal' },
                            { value: 2, label: 'ESEAL - Electronic Seal' },
                            { value: 3, label: 'RFID - Radio Frequency Identifier' }
                          ]}
                          placeholder="Select if needed"
                        />
                        <Input label="Seal device ID" {...register(`containers.${index}.sealDeviceId`)} />
                        <Input
                          label="Movement document type"
                          {...register(`containers.${index}.movementDocumentType`)}
                        />
                        <Input
                          label="Movement document number"
                          {...register(`containers.${index}.movementDocumentNumber`)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <Advanced title={`Packing list ranges (${packingRanges.length})`}>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addPackingRange({ packingNumberFrom: '', packingNumberTo: '' })}>
                      + Add packing range
                    </Button>
                    {packingRanges.map((field, index) => (
                      <div key={field.id} className="rounded-lg border border-gray-200 p-3">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-sm font-medium">Range {index + 1}</span>
                          <Button size="sm" variant="ghost" onClick={() => removePackingRange(index)}>
                            Remove
                          </Button>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                          <Input
                            label="Package from"
                            type="number"
                            {...register(`packingRanges.${index}.packingNumberFrom`)}
                          />
                          <Input
                            label="Package to"
                            type="number"
                            {...register(`packingRanges.${index}.packingNumberTo`)}
                          />
                          <Input label="Packing code" {...register(`packingRanges.${index}.packingCode`)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Advanced>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-950">Supporting documents</h3>
                  <p className="mt-1 text-sm text-gray-800">Add references when required for this shipment.</p>
                </div>
                {documents.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => addDocument(emptyDocument())}>
                    + Add document
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {documents.length === 0 && (
                  <Button variant="outline" size="sm" onClick={() => addDocument(emptyDocument())}>
                    + Add document
                  </Button>
                )}
                {documents.map((field, index) => (
                  <DocumentItem key={field.id} formCtx={formCtx} index={index} onRemove={() => removeDocument(index)} />
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-950">Licences</h3>
                  <p className="mt-1 text-sm text-gray-800">Only enter these for schemes that require a licence.</p>
                </div>
                {licenses.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => addLicense({ registrationNumber: '' })}>
                    + Add licence
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {licenses.length === 0 && (
                  <Button variant="outline" size="sm" onClick={() => addLicense({ registrationNumber: '' })}>
                    + Add licence
                  </Button>
                )}
                {licenses.map((field, index) => (
                  <div key={field.id} className="rounded-lg border border-gray-200 p-4">
                    <div className="mb-3 flex justify-between">
                      <h3 className="text-sm font-semibold">Licence {index + 1}</h3>
                      <Button size="sm" variant="ghost" onClick={() => removeLicense(index)}>
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <Input label="Registration number" {...register(`licenses.${index}.registrationNumber`)} />
                      <Input
                        label="Registration date"
                        type={dateType}
                        {...register(`licenses.${index}.registrationDate`)}
                      />
                      <Input
                        label="Invoice serial number"
                        type="number"
                        {...register(`licenses.${index}.invoiceSerialNumber`)}
                      />
                      <Input
                        label="Item serial number"
                        type="number"
                        {...register(`licenses.${index}.itemSerialNumber`)}
                      />
                      <Input
                        label="Licence serial number"
                        type="number"
                        {...register(`licenses.${index}.licenseSerialNumber`)}
                      />
                      <Input label="Item serial, Part E" {...register(`licenses.${index}.itemSerialNumberPartE`)} />
                      <Input label="Item serial, Part C" {...register(`licenses.${index}.itemSerialNumberPartC`)} />
                      <Input
                        label="Licence quantity"
                        type="number"
                        {...register(`licenses.${index}.licenseQuantity`)}
                      />
                      <Input
                        label="Export quantity"
                        type="number"
                        {...register(`licenses.${index}.licenseExportQuantity`)}
                      />
                      <Select<ShippingBillFormValues>
                        label="Goods source"
                        name={`licenses.${index}.indigenousOrImported`}
                        options={[
                          { value: 'I', label: 'Imported' },
                          { value: 'D', label: 'Indigenous' }
                        ]}
                        placeholder="Select if needed"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </PersistentTab>
        </Tabs>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-5">
          <Button variant="outline" type="button" onClick={() => navigate(routes.dashboard)}>
            Cancel
          </Button>
          <div className="flex items-center gap-2.5">
            {activeTab !== 'details' && (
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  const current = formCtx.hooks.getValues()
                  const saved = saveBill(current, draftId)
                  setDraftId(saved.id)
                  setActiveTab(activeTab === 'documents' ? 'invoices' : 'details')
                }}>
                ← Previous
              </Button>
            )}
            {activeTab !== 'documents' ? (
              <Button
                type="button"
                className="shadow-xs"
                onClick={(e) => {
                  e.preventDefault()
                  const current = formCtx.hooks.getValues()
                  const saved = saveBill(current, draftId)
                  setDraftId(saved.id)
                  toast.success('Details saved')
                  setActiveTab(activeTab === 'details' ? 'invoices' : 'documents')
                }}>
                Save & Next →
              </Button>
            ) : (
              <Button type="submit" className="shadow-xs">
                Save changes
              </Button>
            )}
          </div>
        </div>
      </Form>
      {quickAdd && (
        <PartyDialog
          key={`${quickAdd.kind}-${quickAdd.role ?? 'exporter'}-${quickAdd.invoiceIndex ?? 0}`}
          kind={quickAdd.kind}
          initialRole={quickAdd.role === 'itemThirdParty' ? 'thirdParty' : quickAdd.role}
          onClose={() => setQuickAdd(null)}
          onSaved={handleQuickSaved}
        />
      )}
      {quickBranch && (
        <BranchDialog
          key={`${quickBranch.kind}-${quickBranch.ownerId}`}
          kind={quickBranch.kind}
          ownerId={quickBranch.ownerId}
          onClose={() => setQuickBranch(null)}
          onSaved={(branch: Branch) =>
            setValue(quickBranch.branchName as Path<ShippingBillFormValues>, String(branch.id), {
              shouldValidate: true
            })
          }
        />
      )}
    </div>
  )
}

export default function ShippingBillPage() {
  const { id } = useParams<{ id?: string }>()
  const { bills } = useDemoData()
  const bill = id ? bills.find((item) => item.id === Number(id)) || shippingBillService.getById(id) : undefined
  if (id && !bill)
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Shipping bill not found</h1>
        <Button onClick={() => navigate(routes.dashboard)}>Back to list</Button>
      </div>
    )
  return <BillEditor key={id ?? 'new'} bill={bill} />
}
