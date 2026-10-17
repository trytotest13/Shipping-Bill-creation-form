import { errorMessage } from '@/shared/errors'
import { routes } from '@/shared/route-paths'
import { navigate } from 'core/routing'
import { toast } from 'core/toast-manager'
import { useCallback } from 'react'
import type { SavedBill, ShippingBillFormValues } from '../model'
import { shippingBillService } from '../services/shipping-bill-service'
import { saveBill } from '../store/demo-store'

interface UseSaveShippingBillArgs {
  bill?: SavedBill
  draftId: number | undefined
  onDraftSaved: (id: number) => void
}

// Save pipeline: persist locally first (offline-tolerant), then best-effort sync to the API.
export function useSaveShippingBill({ bill, draftId, onDraftSaved }: UseSaveShippingBillArgs) {
  return useCallback(
    async function handleSave(values: ShippingBillFormValues) {
      try {
        const saved = saveBill(values, draftId)
        onDraftSaved(saved.id)

        try {
          await shippingBillService.upsert(values)
        } catch (error) {
          console.warn('Backend sync skipped (saved locally):', errorMessage(error))
        }

        toast.success(bill ? 'Shipping bill updated' : 'Shipping bill created')
        navigate(routes.toShippingBillEdit(saved.id))
      } catch (error) {
        console.error('Error saving shipping bill:', error)
        toast.error('Failed to save shipping bill')
      }
    },
    [bill, draftId, onDraftSaved]
  )
}
