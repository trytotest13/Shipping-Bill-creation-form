import { useEffect, useState } from 'react'
import type { BillFormOptions } from '../services/form-options-service'
import { fetchBillFormOptions } from '../services/form-options-service'

let cachedOptions: BillFormOptions | undefined
let pendingRequest: Promise<BillFormOptions> | undefined

function requestOptions() {
  pendingRequest ??= fetchBillFormOptions()
  return pendingRequest
}

// One shared load for all fixed option sets (code lists, currencies, ports...).
// Components read `options.x ?? []` and render placeholders while isLoading.
export function useFormOptions() {
  const [options, setOptions] = useState<BillFormOptions | undefined>(cachedOptions)
  const [isLoading, setIsLoading] = useState(!cachedOptions)
  const [hasFailed, setHasFailed] = useState(false)

  useEffect(() => {
    if (cachedOptions) return
    let active = true
    requestOptions()
      .then((loaded) => {
        cachedOptions = loaded
        if (active) {
          setOptions(loaded)
          setIsLoading(false)
        }
      })
      .catch(() => {
        pendingRequest = undefined
        if (active) {
          setIsLoading(false)
          setHasFailed(true)
        }
      })
    return () => {
      active = false
    }
  }, [])

  return { options, isLoading, hasFailed }
}
