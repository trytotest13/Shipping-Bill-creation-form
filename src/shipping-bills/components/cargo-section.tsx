import { useFieldArray } from 'core/form'
import { Button } from 'ui/basic/button'
import { Card, CardContent, CardHeader } from 'ui/basic/card'
import { getFormContext } from 'ui/form'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { useFormOptions } from '../hooks/use-form-options'
import { inputDateType } from '../input-date-type'
import type { ShippingBillFormValues } from '../model'
import { Disclosure } from './ui/disclosure'
import { SectionHeading } from './ui/section-heading'

// Tab 3a: containerized cargo details and packing list ranges.
export function CargoSection() {
  const { register, control } = getFormContext().hooks
  const { options } = useFormOptions()
  const {
    fields: containers,
    append: addContainer,
    remove: removeContainer
  } = useFieldArray({ control, name: 'containers' })
  const {
    fields: packingRanges,
    append: addPackingRange,
    remove: removePackingRange
  } = useFieldArray({ control, name: 'packingRanges' })

  return (
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
                  options={options?.containerSizes ?? []}
                  placeholder="Select size"
                />
                <Input label="Seal number" {...register(`containers.${index}.exciseSealNumber`)} />
                <Input label="Seal date" type={inputDateType} {...register(`containers.${index}.sealDate`)} />
                <Select<ShippingBillFormValues>
                  label="Seal type"
                  name={`containers.${index}.sealType`}
                  options={options?.containerSealTypes ?? []}
                  placeholder="Select if needed"
                />
                <Input label="Seal device ID" {...register(`containers.${index}.sealDeviceId`)} />
                <Input label="Movement document type" {...register(`containers.${index}.movementDocumentType`)} />
                <Input label="Movement document number" {...register(`containers.${index}.movementDocumentNumber`)} />
              </div>
            </div>
          ))}
        </div>
        <Disclosure title={`Packing list ranges (${packingRanges.length})`}>
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
                  <Input label="Package from" type="number" {...register(`packingRanges.${index}.packingNumberFrom`)} />
                  <Input label="Package to" type="number" {...register(`packingRanges.${index}.packingNumberTo`)} />
                  <Input label="Packing code" {...register(`packingRanges.${index}.packingCode`)} />
                </div>
              </div>
            ))}
          </div>
        </Disclosure>
      </CardContent>
    </Card>
  )
}
