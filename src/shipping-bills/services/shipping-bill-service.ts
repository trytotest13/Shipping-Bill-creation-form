import { textOr } from '@/shared/format'
import { SavedBill, ShippingBillFormValues } from '../model'
import { apiBaseUrl, apiRequest } from './api-client'
import { API_SEED_SHIPPING_BILLS } from './api-seed'
import { downloadTextFile, filenameFromDisposition, generateFlatFileContent, textFromJsonFlatFile } from './flat-file'
import { normalizeApiBills, toHttpShippingBillPayload } from './shipping-bill-mapper'

let internalBills: SavedBill[] = normalizeApiBills(API_SEED_SHIPPING_BILLS)

export const shippingBillService = {
  getInitialBills(): SavedBill[] {
    return internalBills
  },

  getById(id: string | number): SavedBill | undefined {
    return internalBills.find((bill) => String(bill.id) === String(id))
  },

  /**
   * GET /api/shipping-bills
   * List all shipping bills (per shipping_bill.http)
   */
  async list(): Promise<SavedBill[]> {
    try {
      const response = await apiRequest('/api/shipping-bills')
      const data: unknown = await response.json()
      const normalized = normalizeApiBills(data)
      if (normalized.length > 0) {
        internalBills = normalized
        return normalized
      }
    } catch {
      // Backend unreachable or responded with an unusable body: keep the seed records.
    }
    return internalBills
  },

  /**
   * GET /api/shipping-bills/:id/flat-file
   * Fetch flat file text or payload (per shipping_bill.http)
   */
  async getFlatFile(id: string | number): Promise<unknown> {
    const response = await apiRequest(`/api/shipping-bills/${id}/flat-file`, {
      headers: { Accept: '*/*' }
    })
    const contentType = response.headers.get('content-type') ?? ''
    return contentType.includes('application/json') ? response.json() : response.text()
  },

  /**
   * Download shipping bill flat file (.sb) directly in the browser.
   * Tries backend API first; falls back to generating .sb flat file locally from bill data.
   */
  async downloadFlatFile(id: string | number, billData?: SavedBill): Promise<{ source: 'api' | 'local' }> {
    try {
      const response = await apiRequest(`/api/shipping-bills/${id}/flat-file`, {
        headers: { Accept: '*/*' }
      })
      const filename = filenameFromDisposition(response.headers.get('content-disposition')) ?? `shipping_bill_${id}.sb`
      const contentType = response.headers.get('content-type') ?? ''
      const content = contentType.includes('application/json')
        ? textFromJsonFlatFile(await response.json())
        : await response.text()
      downloadTextFile(content, filename)
      return { source: 'api' }
    } catch {
      // Backend offline, HTTP error, or unusable body: fall through to local generation.
    }

    if (billData) {
      const jobLabel = textOr(billData.values.jobNumber, String(billData.id))
      downloadTextFile(generateFlatFileContent(billData), `shipping_bill_${jobLabel}.sb`)
      return { source: 'local' }
    }

    throw new Error(`Backend server (${apiBaseUrl}) is offline and no local bill data was found.`)
  },

  /**
   * POST /api/shipping-bills
   * Upsert shipping bill (per shipping_bill.http)
   */
  async upsert(values: ShippingBillFormValues) {
    await apiRequest('/api/shipping-bills', {
      method: 'POST',
      body: toHttpShippingBillPayload(values)
    })
  }
}
