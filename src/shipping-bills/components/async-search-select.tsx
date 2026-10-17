import { RrCaretDown } from 'icons/rr/fi-rr-caret-down'
import { useEffect, useRef, useState } from 'react'
import { getFormContext, Path, RegisterOptions, useController } from 'ui/form'
import { InputError } from 'ui/inputs/error'
import { Popover, PopoverContent, PopoverTrigger } from 'ui/interactive/popover'
import { PopoverContext } from 'ui/interactive/popover-context'
import { clsx, getContext } from 'ui/utils'
import type { ShippingBillFormValues } from '../model'

export interface SearchOption {
  value: string
  label: string
  sublabel?: string
}

type BillFieldPath = Path<ShippingBillFormValues>

export interface AsyncSearchSelectProps {
  name: BillFieldPath
  placeholder?: string
  disabled?: boolean
  className?: string
  rules?: RegisterOptions
  deps?: React.DependencyList
  fetchOptions: (query: string) => Promise<SearchOption[]>
  getInitialLabel?: (id: string) => Promise<string>
}

const SEARCH_DEBOUNCE_MS = 200

// Text-search driven select backed by async option loaders. Used for parties, branches, ports and codes.
export function AsyncSearchSelect({
  name,
  placeholder = 'Search...',
  disabled = false,
  className,
  rules,
  deps = [],
  fetchOptions,
  getInitialLabel
}: AsyncSearchSelectProps) {
  const ctx = getFormContext()
  const {
    field: { onChange, value, ref }
  } = useController({
    name,
    control: ctx.hooks.control,
    rules: ctx.schema.shape[name] ?? rules,
    disabled
  })

  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<SearchOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasFailed, setHasFailed] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const fetchOptionsRef = useRef(fetchOptions)
  fetchOptionsRef.current = fetchOptions

  const getInitialLabelRef = useRef(getInitialLabel)
  getInitialLabelRef.current = getInitialLabel

  useEffect(() => {
    let active = true
    if (value) {
      if (getInitialLabelRef.current) {
        getInitialLabelRef
          .current(String(value))
          .then((label) => {
            if (active && label) setSelectedLabel(label)
          })
          .catch(() => {
            // Keep the previous label when the initial-label lookup fails.
          })
      } else {
        const found = options.find((option) => option.value === String(value))
        if (found) setSelectedLabel(found.label)
      }
    } else {
      setSelectedLabel('')
    }
    return () => {
      active = false
    }
  }, [value, ...deps])

  useEffect(() => {
    if (!isOpen && !query) return

    let active = true
    setIsLoading(true)
    setHasFailed(false)
    const timer = setTimeout(() => {
      fetchOptionsRef
        .current(query)
        .then((results) => {
          if (active) {
            setOptions(results)
            setIsLoading(false)
          }
        })
        .catch(() => {
          if (active) {
            setOptions([])
            setIsLoading(false)
            setHasFailed(true)
          }
        })
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query, isOpen, ...deps])

  function selectOption(option: SearchOption) {
    onChange(option.value)
    ctx.hooks.setValue(name, option.value, { shouldValidate: true, shouldDirty: true, shouldTouch: true })
    setSelectedLabel(option.label)
    setQuery('')
  }

  return (
    <div>
      <input type="hidden" name={name} value={value ?? ''} ref={ref} disabled={disabled} />
      <Popover placement="bottom-start" fallbackPlacements={['top-start']} onOpenCallback={(open) => setIsOpen(open)}>
        <PopoverTrigger
          className={clsx(
            'outline-focus-select group flex w-full cursor-pointer items-center justify-between rounded border border-gray-200 bg-inherit pr-2 hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          disabled={disabled}>
          <div className="flex items-center p-2 text-sm">
            <span className={selectedLabel ? 'font-semibold text-gray-950' : 'text-gray-800'}>
              {selectedLabel || placeholder}
            </span>
          </div>
          <RrCaretDown className="size-4 text-gray-800 transition-transform group-data-[state=open]:rotate-180" />
        </PopoverTrigger>
        <InputError<ShippingBillFormValues> name={name} />
        <PopoverContent className="overflow-hidden rounded-md border border-gray-200 shadow-lg">
          <div className="border-b border-gray-100 p-2">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Type to search..."
              className="focus:border-primary-500 focus:ring-primary-500 w-full rounded border border-gray-200 bg-inherit px-2.5 py-1.5 text-sm text-gray-950 outline-none placeholder:text-gray-800 focus:ring-1"
              autoFocus
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {isLoading ? (
              <div className="p-3 text-center text-xs text-gray-800">Searching...</div>
            ) : hasFailed ? (
              <div className="p-3 text-center text-xs text-red-700 dark:text-red-300">
                Search failed. Close and reopen to retry.
              </div>
            ) : options.length === 0 ? (
              <div className="p-3 text-center text-xs text-gray-800">No matching results found</div>
            ) : (
              options.map((option) => (
                <PopoverOptionItem
                  key={option.value}
                  option={option}
                  isSelected={String(value) === option.value}
                  onSelect={selectOption}
                />
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function PopoverOptionItem({
  option,
  isSelected,
  onSelect
}: {
  option: SearchOption
  isSelected: boolean
  onSelect: (option: SearchOption) => void
}) {
  const { setOpen } = getContext(PopoverContext)

  return (
    <div
      onClick={() => {
        onSelect(option)
        setOpen(false)
      }}
      className={clsx(
        'flex cursor-pointer flex-col rounded p-2 text-sm transition-colors',
        isSelected ? 'bg-primary-600 font-semibold text-white' : 'text-gray-950 hover:bg-gray-100'
      )}>
      <span>{option.label}</span>
      {option.sublabel && <span className="text-xs text-gray-800">{option.sublabel}</span>}
    </div>
  )
}
