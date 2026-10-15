import { useEffect, useRef, useState } from 'react'
import { getMarksAndNumbersOptions, MarksAndNumbersOption } from '../services/marks-and-numbers-source'

export function useMarksAndNumbers(exporterId: string | undefined, setValue: (name: 'marksAndNumbers', value: string, options?: { shouldValidate?: boolean }) => void) {
  const [options, setOptions] = useState<MarksAndNumbersOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const previousExporterId = useRef(exporterId)

  useEffect(() => {
    if (previousExporterId.current !== exporterId) {
      previousExporterId.current = exporterId
      setValue('marksAndNumbers', '', { shouldValidate: true })
    }

    let cancelled = false
    setOptions([])
    setIsLoading(Boolean(exporterId))
    if (exporterId) {
      void getMarksAndNumbersOptions(exporterId)
        .then((next) => {
          if (cancelled) return
          setOptions(next)
          setIsLoading(false)
        })
        .catch(() => {
          if (cancelled) return
          setOptions([])
          setIsLoading(false)
        })
    }

    return () => {
      cancelled = true
    }
  }, [setValue, exporterId])

  return { options, isLoading }
}
