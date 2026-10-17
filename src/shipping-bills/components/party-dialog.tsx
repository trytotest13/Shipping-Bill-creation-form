import { InferType, s, useForm } from 'core/form'
import { Form, SubmitButton } from 'core/form/components'
import { toast } from 'core/toast-manager'
import { Button } from 'ui/basic/button'
import { Checkbox } from 'ui/inputs/checkbox'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { Textarea } from 'ui/inputs/text-area'
import { Dialog, DialogContent } from 'ui/interactive/dialog'
import { useFormOptions } from '../hooks/use-form-options'
import { Business, Exporter } from '../model'
import { saveBusiness, saveExporter } from '../store/demo-store'

const partySchema = s.object({
  name: s.string().minVal(2),
  iec: s.string().optional(),
  class: s.string().optional(),
  type: s.string().optional(),
  pan: s.string().optional(),
  tan: s.string().optional(),
  aeoNumber: s.string().optional(),
  website: s.string().optional(),
  notes: s.string().optional(),
  isConsignee: s.boolean().optional(),
  isBuyer: s.boolean().optional(),
  isNotify: s.boolean().optional(),
  isThirdParty: s.boolean().optional(),
  branchName: s.string().optional(),
  address1: s.string().optional(),
  city: s.string().optional(),
  state: s.string().optional(),
  pincode: s.string().optional(),
  countryCode: s.string()
})

type PartyFields = InferType<typeof partySchema>

export interface PartyDialogProps {
  kind: 'exporter' | 'business'
  party?: Exporter | Business
  initialRole?: 'consignee' | 'buyer' | 'thirdParty'
  onClose: () => void
  onSaved?: (party: Exporter | Business) => void
}

export function PartyDialog({ kind, party, initialRole, onClose, onSaved }: PartyDialogProps) {
  const isNew = party == null
  const { options } = useFormOptions()
  const formCtx = useForm<PartyFields>(partySchema, {
    defaultValues: {
      name: party?.name ?? '',
      iec: party?.iec ?? '',
      class: kind === 'exporter' ? ((party as Exporter | undefined)?.class ?? 'F') : undefined,
      type: kind === 'exporter' ? ((party as Exporter | undefined)?.type ?? 'P') : undefined,
      pan: kind === 'exporter' ? ((party as Exporter | undefined)?.pan ?? '') : undefined,
      tan: kind === 'exporter' ? ((party as Exporter | undefined)?.tan ?? '') : undefined,
      aeoNumber: kind === 'exporter' ? ((party as Exporter | undefined)?.aeoNumber ?? '') : undefined,
      website: kind === 'exporter' ? ((party as Exporter | undefined)?.website ?? '') : undefined,
      notes: kind === 'exporter' ? ((party as Exporter | undefined)?.notes ?? '') : undefined,
      isConsignee:
        kind === 'business' ? ((party as Business | undefined)?.isConsignee ?? initialRole === 'consignee') : false,
      isBuyer: kind === 'business' ? ((party as Business | undefined)?.isBuyer ?? initialRole === 'buyer') : false,
      isNotify: kind === 'business' ? ((party as Business | undefined)?.isNotify ?? false) : false,
      isThirdParty:
        kind === 'business' ? ((party as Business | undefined)?.isThirdParty ?? initialRole === 'thirdParty') : false,
      branchName: '',
      address1: '',
      city: '',
      countryCode: kind === 'exporter' ? 'IN' : ''
    }
  })
  const { register } = formCtx.hooks

  function handleSave(values: PartyFields) {
    const firstBranch = isNew
      ? {
          branchName: values.branchName!,
          address1: values.address1!,
          city: values.city!,
          state: values.state,
          pincode: values.pincode,
          countryCode: values.countryCode
        }
      : undefined
    const saved =
      kind === 'exporter'
        ? saveExporter({
            id: party?.id,
            name: values.name.trim(),
            iec: values.iec?.trim() ?? '',
            class: values.class ?? 'F',
            type: values.type ?? 'P',
            pan: values.pan,
            tan: values.tan,
            aeoNumber: values.aeoNumber,
            website: values.website,
            notes: values.notes,
            firstBranch
          })
        : saveBusiness({
            id: party?.id,
            name: values.name.trim(),
            iec: values.iec,
            isConsignee: !!values.isConsignee,
            isBuyer: !!values.isBuyer,
            isNotify: !!values.isNotify,
            isThirdParty: !!values.isThirdParty,
            firstBranch
          })
    toast.success(`${kind === 'exporter' ? 'Exporter' : 'Business'} saved`)
    onSaved?.(saved)
    onClose()
  }

  return (
    <Dialog open setOpen={(open) => !open && onClose()}>
      <DialogContent center>
        <div className="foreground max-h-[90vh] w-[min(92vw,42rem)] overflow-y-auto rounded-xl border border-gray-200 p-6 shadow-xl">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">
              {isNew ? 'Add' : 'Edit'} {kind}
            </h2>
            <p className="mt-1 text-sm font-medium text-gray-800">
              {isNew
                ? 'Add the main details and one address. You can add more branches later.'
                : 'Update the shared master record.'}
            </p>
          </div>
          <Form ctx={formCtx} handleSubmit={handleSave} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Name" {...register('name')} wrapClass="sm:col-span-2" />
              <Input label="IEC" {...register('iec')} />
              {kind === 'exporter' ? (
                <>
                  <Select<PartyFields>
                    label="Exporter class"
                    name="class"
                    options={[
                      { value: 'F', label: 'Manufacturer' },
                      { value: 'R', label: 'Merchant' },
                      { value: 'C', label: 'Merchant courier' },
                      { value: 'D', label: 'Manufacturer courier' }
                    ]}
                  />
                  <Select<PartyFields>
                    label="Exporter type"
                    name="type"
                    options={[
                      { value: 'P', label: 'Private' },
                      { value: 'G', label: 'Government' },
                      { value: 'W', label: 'Warehouse' }
                    ]}
                  />
                </>
              ) : (
                <div className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium">Used as</span>
                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                    {(
                      [
                        ['isConsignee', 'Consignee'],
                        ['isBuyer', 'Buyer'],
                        ['isNotify', 'Notify party'],
                        ['isThirdParty', 'Third party']
                      ] as const
                    ).map(([name, label]) => (
                      <label key={name} className="flex items-center gap-2">
                        <Checkbox {...register(name)} />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {kind === 'exporter' && (
              <details className="rounded-lg border border-gray-200 p-3">
                <summary className="cursor-pointer text-sm font-medium">More exporter details</summary>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Input label="PAN" {...register('pan')} />
                  <Input label="TAN" {...register('tan')} />
                  <Input label="AEO number" {...register('aeoNumber')} />
                  <Input label="Website" {...register('website')} />
                  <Textarea label="Notes" {...register('notes')} wrapClass="sm:col-span-2" />
                </div>
              </details>
            )}
            {isNew && (
              <section className="border-t border-gray-200 pt-4">
                <h3 className="mb-3 font-medium">First branch</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Branch name" {...register('branchName', { required: true })} />
                  <Input label="Address line 1" {...register('address1', { required: true })} />
                  <Input label="City" {...register('city', { required: true })} />
                  <Select<PartyFields>
                    label="Country"
                    name="countryCode"
                    options={options?.countries ?? []}
                    placeholder="Select country"
                  />
                  <Input label="State / province" {...register('state')} />
                  <Input label="Postal code" {...register('pincode')} />
                </div>
              </section>
            )}
            <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <SubmitButton>Save {kind}</SubmitButton>
            </div>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
