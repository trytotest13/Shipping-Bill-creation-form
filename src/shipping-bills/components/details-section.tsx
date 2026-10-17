import { stateOptions } from '@/data/states'
import { cargoOptions, sealTypes, weightUnits } from '@/data/types'
import { Card, CardContent, CardHeader } from 'ui/basic/card'
import { getFormContext } from 'ui/form'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { useMarksAndNumbers } from '../hooks/use-marks-and-numbers'
import { portCountry, ShippingBillFormValues } from '../model'
import { inputDateType, nfeiCategoryOptions, portOptions } from '../options'
import { partyMockService } from '../services/party-mock-service'
import { useDemoData } from '../store/demo-store'
import { AsyncSearchSelect } from './async-search-select'
import { PartyFields } from './party-fields'
import { Disclosure } from './ui/disclosure'
import { SectionHeading } from './ui/section-heading'

interface DetailsSectionProps {
  onQuickAdd: (kind: 'exporter' | 'business', role?: 'consignee') => void
  onAddBranch: (kind: 'exporter' | 'business', ownerId: number) => void
}

// Tab 1: parties, route, regulatory exceptions and package details.
export function DetailsSection({ onQuickAdd, onAddBranch }: DetailsSectionProps) {
  const { register, watch } = getFormContext().hooks
  const { exporters, businesses } = useDemoData()
  const exporterId = watch('exporterId')
  const consigneeId = watch('consigneeId')
  const loadingPort = watch('loadingPort')
  const finalDestinationPort = watch('finalDestinationPort')
  const numberOfContainers = watch('containers')
  const { options: marksAndNumbersOptions, isLoading: marksAndNumbersLoading } = useMarksAndNumbers(
    exporterId,
    (name, value) => getFormContext().hooks.setValue(name, value, { shouldValidate: true })
  )
  const consigneeOptions = businesses.filter((business) => business.isConsignee || String(business.id) === consigneeId)

  return (
    <Card>
      <CardHeader title="Shipment basics" description="Parties and route are the core details for this bill." />
      <CardContent className="space-y-5">
        <PartyFields
          ownerName="exporterId"
          branchName="exporterBranchId"
          label="Exporter"
          kind="exporter"
          parties={exporters.filter((item) => !item.disabled || String(item.id) === exporterId)}
          onQuickAdd={() => onQuickAdd('exporter')}
          onAddBranch={(ownerId) => onAddBranch('exporter', ownerId)}
        />
        <PartyFields
          ownerName="consigneeId"
          branchName="consigneeBranchId"
          label="Consignee"
          kind="business"
          parties={consigneeOptions}
          onQuickAdd={() => onQuickAdd('business', 'consignee')}
          onAddBranch={(ownerId) => onAddBranch('business', ownerId)}
        />

        <div className="border-t border-gray-200 pt-5">
          <SectionHeading title="Route" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="mb-1 block text-sm font-medium">Port of loading</span>
              <AsyncSearchSelect
                name="loadingPort"
                placeholder="Select Indian port"
                rules={{ required: true }}
                fetchOptions={async (query) => {
                  const results = await partyMockService.searchLoadingPorts(query)
                  return results.map((port) => ({
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
              <AsyncSearchSelect
                name="finalDestinationPort"
                placeholder="Select destination"
                rules={{ required: true }}
                fetchOptions={async (query) => {
                  const results = await partyMockService.searchDestinationPorts(query)
                  return results.map((port) => ({
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
            Countries are derived from the port codes when saved: {portCountry(loadingPort) || '—'} →{' '}
            {portCountry(finalDestinationPort) || '—'}.
          </p>
        </div>
        <Disclosure title="Regulatory and route exceptions">
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
              options={nfeiCategoryOptions}
              placeholder="Not applicable"
            />
            <Input label="RBI waiver number" {...register('rbiWaiverNumber')} />
            <Input label="RBI waiver date" type={inputDateType} {...register('rbiWaiverDate')} />
          </div>
        </Disclosure>

        <div className="border-t border-gray-200 pt-5">
          <SectionHeading title="Package Detail" />
          <div className="grid gap-4 pb-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select<ShippingBillFormValues> label="Nature of cargo" name="natureOfCargo" options={cargoOptions} />
            <Input label="Gross weight" type="number" {...register('grossWeight')} />
            <Input label="Net weight" type="number" {...register('netWeight')} />
            <Select<ShippingBillFormValues> label="Weight unit" name="measurementUnit" options={weightUnits} />
            <Input label="Total packages" type="number" {...register('totalPackages')} />
            <Select<ShippingBillFormValues>
              label="Marks and numbers"
              name="marksAndNumbers"
              options={marksAndNumbersOptions}
              placeholder={
                !exporterId
                  ? 'Select exporter first'
                  : marksAndNumbersLoading
                    ? 'Loading marks and numbers...'
                    : 'Select marks and numbers'
              }
              disabled={!exporterId || marksAndNumbersLoading || !marksAndNumbersOptions.length}
              wrapClass="sm:col-span-3"
            />
          </div>
          <Disclosure title="Additional Details">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Select<ShippingBillFormValues>
                label="Seal type"
                name="sealType"
                options={sealTypes}
                placeholder="Select if relevant"
              />
              {(!numberOfContainers || numberOfContainers.length === 0) && (
                <Input label="Number of containers" type="number" {...register('numberOfContainers')} />
              )}
              <Input label="Loose packets" type="number" {...register('loosePackets')} />
              <Input label="MAWB number" {...register('mawbNumber')} />
              <Input label="HAWB number" {...register('hawbNumber')} />
            </div>
          </Disclosure>
        </div>
      </CardContent>
    </Card>
  )
}
