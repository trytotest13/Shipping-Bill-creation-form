import { useForm } from 'core/form'
import { toast } from 'core/toast-manager'
import { useEffect, useState } from 'react'
import { emptyBill, SavedBill, ShippingBillFormValues } from '../model'
import { billSchema } from '../schema'

export type BillFormContext = ReturnType<typeof useForm<ShippingBillFormValues>>

export type BillTab = 'details' | 'invoices' | 'documents'

const detailsTabFields = [
  'jobDate',
  'exporterId',
  'exporterBranchId',
  'consigneeId',
  'consigneeBranchId',
  'loadingPort',
  'finalDestinationPort'
] as const

// Form shell: RHF instance, draft id and active tab with error-driven tab routing on submit.
export function useShippingBillForm(bill?: SavedBill) {
  const formCtx = useForm<ShippingBillFormValues>(billSchema, { defaultValues: bill?.values ?? emptyBill() })
  const { formState } = formCtx.hooks
  const [activeTab, setActiveTab] = useState<BillTab>('details')
  const [draftId, setDraftId] = useState<number | undefined>(bill?.id)

  useEffect(() => {
    if (!formState.submitCount || !Object.keys(formState.errors).length) return
    console.log('Form validation errors on submit:', formState.errors)
    toast.error('Please check the required fields')
    if (detailsTabFields.some((field) => field in formState.errors)) setActiveTab('details')
    else if (formState.errors.invoices) setActiveTab('invoices')
    else if (
      formState.errors.containers ||
      formState.errors.packingRanges ||
      formState.errors.documents ||
      formState.errors.licenses
    )
      setActiveTab('documents')
    // else: keep user on whichever tab they submitted from
  }, [formState.submitCount, formState.errors])

  return {
    formCtx,
    activeTab,
    setActiveTab,
    draftId,
    setDraftId
  }
}
