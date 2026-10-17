import type { ShippingBillFormValues } from './bill'
import type { ShippingBillApiPayload } from './payload'

export interface SavedBill {
  id: number
  created: string
  updated: string
  values: ShippingBillFormValues
  payload?: ShippingBillApiPayload
}
