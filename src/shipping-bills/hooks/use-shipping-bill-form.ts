import { useFieldArray, useForm } from 'core/form'
import { toast } from 'core/toast-manager'
import { useEffect, useState } from 'react'
import { emptyBill, SavedBill, ShippingBillFormValues } from '../model'
import { billSchema } from '../schema'

export type BillFormContext = ReturnType<typeof useForm<ShippingBillFormValues>>

export function useShippingBillForm(bill?: SavedBill) {
  const formCtx = useForm<ShippingBillFormValues>(billSchema, { defaultValues: bill?.values ?? emptyBill() })
  const { control, setValue, formState } = formCtx.hooks
  const values = formCtx.hooks.watch()
  const invoices = useFieldArray({ control, name: 'invoices' })
  const containers = useFieldArray({ control, name: 'containers' })
  const packingRanges = useFieldArray({ control, name: 'packingRanges' })
  const documents = useFieldArray({ control, name: 'documents' })
  const licenses = useFieldArray({ control, name: 'licenses' })
  const [activeTab, setActiveTab] = useState('details')
  const [draftId, setDraftId] = useState<number | undefined>(bill?.id)

  useEffect(() => {
    if (!formState.submitCount || !Object.keys(formState.errors).length) return
    console.log('Form validation errors on submit:', formState.errors)
    toast.error('Please check the required fields')
    if (
      [
        'jobDate',
        'exporterId',
        'exporterBranchId',
        'consigneeId',
        'consigneeBranchId',
        'loadingPort',
        'finalDestinationPort'
      ].some((field) => field in formState.errors)
    )
      setActiveTab('details')
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
    values,
    setValue,
    formState,
    invoices,
    containers,
    packingRanges,
    documents,
    licenses,
    activeTab,
    setActiveTab,
    draftId,
    setDraftId
  }
}
