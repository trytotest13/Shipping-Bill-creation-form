import { InferType, s, useForm } from 'core/form'
import { Form, SubmitButton } from 'core/form/components'
import { toast } from 'core/toast-manager'
import { Button } from 'ui/basic/button'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { Dialog, DialogContent } from 'ui/interactive/dialog'
import { Branch, countries } from '../model'
import { saveBranch } from '../store/demo-store'

const branchSchema = s.object({
  branchName: s.string().minVal(2),
  address1: s.string().minVal(2),
  address2: s.string().optional(),
  city: s.string().minVal(2),
  state: s.string().optional(),
  pincode: s.string().optional(),
  countryCode: s.string(),
  email: s.string().optional(),
  mobile: s.string().optional(),
  gstnId: s.string().optional(),
  adCode: s.string().optional(),
  accountNo: s.string().optional(),
  ifscCode: s.string().optional()
})
type BranchFields = InferType<typeof branchSchema>

export interface BranchDialogProps {
  kind: 'exporter' | 'business'
  ownerId: number
  branch?: Branch
  onClose: () => void
  onSaved?: (branch: Branch) => void
}

export function BranchDialog({ kind, ownerId, branch, onClose, onSaved }: BranchDialogProps) {
  const formCtx = useForm<BranchFields>(branchSchema, {
    defaultValues: branch ?? { branchName: '', address1: '', city: '', countryCode: kind === 'exporter' ? 'IN' : '' }
  })
  const { register } = formCtx.hooks

  function handleSave(values: BranchFields) {
    const saved = saveBranch(kind, ownerId, { ...values, id: branch?.id })
    toast.success('Branch saved')
    onSaved?.(saved)
    onClose()
  }

  return (
    <Dialog open setOpen={(open) => !open && onClose()}>
      <DialogContent center>
        <div className="foreground max-h-[90vh] w-[min(92vw,42rem)] overflow-y-auto rounded-xl border border-gray-200 p-6 shadow-xl">
          <h2 className="mb-5 text-lg font-semibold">{branch ? 'Edit' : 'Add'} branch</h2>
          <Form ctx={formCtx} handleSubmit={handleSave} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Branch name" {...register('branchName')} />
              <Input label="Address line 1" {...register('address1')} />
              <Input label="Address line 2" {...register('address2')} />
              <Input label="City" {...register('city')} />
              <Input label="State / province" {...register('state')} />
              <Input label="Postal code" {...register('pincode')} />
              <Select<BranchFields>
                label="Country"
                name="countryCode"
                options={countries}
                placeholder="Select country"
              />
              <Input label="Email" type="email" {...register('email')} />
              <Input label="Mobile" {...register('mobile')} />
              <Input label="GSTIN / tax ID" {...register('gstnId')} />
            </div>
            {kind === 'exporter' && (
              <details className="rounded-lg border border-gray-200 p-3">
                <summary className="cursor-pointer text-sm font-medium">Bank and customs details</summary>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Input label="AD code" {...register('adCode')} />
                  <Input label="Account number" {...register('accountNo')} />
                  <Input label="IFSC code" {...register('ifscCode')} />
                </div>
              </details>
            )}
            <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <SubmitButton>Save branch</SubmitButton>
            </div>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
