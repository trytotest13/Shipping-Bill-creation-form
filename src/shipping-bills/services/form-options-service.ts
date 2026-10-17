import { documentCodes } from '@/data/e-sanchit-codes'
import { quantityCodes } from '@/data/quantity-code'
import schemeCodesData from '@/data/scheme-codes'
import { stateOptions } from '@/data/states'
import { Trades } from '@/data/trade-agreements'
import { cargoOptions, contractTypes, paymentTypes, priceInclusionTypes, sealTypes, weightUnits } from '@/data/types'
import { countries, ports } from '../model/port'

export interface SelectOption {
  value: string | number
  label: string
}

export interface SearchOption {
  value: string
  label: string
  sublabel?: string
}

export interface SchemeOption {
  value: string
  label: string
  drawback?: boolean
  RODTEP?: boolean
  ROSCTL?: boolean
}

export interface BillFormOptions {
  countries: SelectOption[]
  currencies: SelectOption[]
  dischargePorts: SelectOption[]
  nfeiCategories: SelectOption[]
  igstPayments: SelectOption[]
  accessoryStatuses: SelectOption[]
  containerSizes: SelectOption[]
  containerSealTypes: SelectOption[]
  licenseSources: SelectOption[]
  fileTypes: SelectOption[]
  cargoTypes: SelectOption[]
  sealTypes: SelectOption[]
  weightUnits: SelectOption[]
  states: SelectOption[]
  quantityCodes: SelectOption[]
  schemeCodes: SchemeOption[]
  tradeAgreements: SelectOption[]
  contractTypes: SelectOption[]
  priceInclusionTypes: SelectOption[]
  paymentTypes: SelectOption[]
}

const SIMULATED_LATENCY_MS = 150

function delay<T>(value: T, ms = SIMULATED_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

const currencies: SelectOption[] = ['USD', 'EUR', 'INR', 'AED', 'GBP', 'SGD'].map((value) => ({ value, label: value }))

const nfeiCategories: SelectOption[] = [
  ['01', 'Free trade sample'],
  ['02', 'Diplomatic goods'],
  ['03', 'Warranty replacement'],
  ['07', 'Gift parcel'],
  ['08', 'Other']
].map(([value, label]) => ({ value, label }))

const igstPayments: SelectOption[] = [
  { value: 'NA', label: 'Not applicable' },
  { value: 'LUT', label: 'Under LUT / bond' },
  { value: 'P', label: 'Against payment' }
]

const accessoryStatuses: SelectOption[] = [
  { value: '0', label: 'No accessory' },
  { value: '1', label: 'Included free of cost' },
  { value: '2', label: 'Entered separately' }
]

const containerSizes: SelectOption[] = [
  { value: '20', label: '20 ft' },
  { value: '40', label: '40 ft' },
  { value: '45', label: '45 ft' }
]

const containerSealTypes: SelectOption[] = [
  { value: 1, label: 'BTSL - Bottle Seal' },
  { value: 2, label: 'ESEAL - Electronic Seal' },
  { value: 3, label: 'RFID - Radio Frequency Identifier' }
]

const licenseSources: SelectOption[] = [
  { value: 'I', label: 'Imported' },
  { value: 'D', label: 'Indigenous' }
]

const fileTypes: SelectOption[] = [{ value: 'pdf', label: 'PDF' }]

const dischargePorts: SelectOption[] = ports.map((port) => ({ value: port.code, label: `${port.name} · ${port.code}` }))

const schemeCodes: SchemeOption[] = schemeCodesData

/**
 * Mock source of every fixed option list on the shipping-bill form (government code lists
 * and domain constants). Simulates one async fetch; replacing the body with a real HTTP
 * request requires no UI changes.
 */
export function fetchBillFormOptions(): Promise<BillFormOptions> {
  return delay({
    countries,
    currencies,
    dischargePorts,
    nfeiCategories,
    igstPayments,
    accessoryStatuses,
    containerSizes,
    containerSealTypes,
    licenseSources,
    fileTypes,
    cargoTypes: cargoOptions,
    sealTypes,
    weightUnits,
    states: stateOptions,
    quantityCodes,
    schemeCodes,
    tradeAgreements: Trades,
    contractTypes,
    priceInclusionTypes,
    paymentTypes
  })
}

export function searchDocumentCodes(query: string): Promise<SearchOption[]> {
  const q = query.toLowerCase().trim()
  return delay(
    documentCodes
      .filter((code) => code.label.toLowerCase().includes(q) || code.value.toLowerCase().includes(q))
      .map((code) => ({ value: code.value, label: code.label }))
  )
}

export function getDocumentCodeLabel(value: string): Promise<string> {
  const found = documentCodes.find((code) => code.value === value || code.label === value)
  return Promise.resolve(found ? found.label : value)
}

export function searchFileTypes(query: string): Promise<SearchOption[]> {
  const q = query.toLowerCase().trim()
  return delay(
    fileTypes
      .filter((option) => option.label.toLowerCase().includes(q) || String(option.value).toLowerCase().includes(q))
      .map((option) => ({ value: String(option.value), label: option.label }))
  )
}

export function getFileTypeLabel(value: string): Promise<string> {
  const found = fileTypes.find((option) => option.value === value || option.label === value)
  return Promise.resolve(found ? found.label : value)
}
