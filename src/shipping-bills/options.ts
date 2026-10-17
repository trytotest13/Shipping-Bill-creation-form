import { ports } from './model/port'

export const portOptions = ports.map((port) => ({ value: port.code, label: `${port.name} · ${port.code}` }))

export const currencyOptions = ['USD', 'EUR', 'INR', 'AED', 'GBP', 'SGD'].map((value) => ({ value, label: value }))

// ui/inputs Input does not accept 'date' in its type union yet; the runtime input still renders a date picker.
export const inputDateType = 'date' as 'text'

export const nfeiCategoryOptions = [
  ['01', 'Free trade sample'],
  ['02', 'Diplomatic goods'],
  ['03', 'Warranty replacement'],
  ['07', 'Gift parcel'],
  ['08', 'Other']
].map(([value, label]) => ({ value, label }))

export const igstPaymentOptions = [
  { value: 'NA', label: 'Not applicable' },
  { value: 'LUT', label: 'Under LUT / bond' },
  { value: 'P', label: 'Against payment' }
]

export const accessoryStatusOptions = [
  { value: '0', label: 'No accessory' },
  { value: '1', label: 'Included free of cost' },
  { value: '2', label: 'Entered separately' }
]

export const containerSizeOptions = [
  { value: '20', label: '20 ft' },
  { value: '40', label: '40 ft' },
  { value: '45', label: '45 ft' }
]

export const containerSealTypeOptions = [
  { value: 1, label: 'BTSL - Bottle Seal' },
  { value: 2, label: 'ESEAL - Electronic Seal' },
  { value: 3, label: 'RFID - Radio Frequency Identifier' }
]

export const fileTypeOptions = [{ value: 'pdf', label: 'PDF' }]

export const licenseSourceOptions = [
  { value: 'I', label: 'Imported' },
  { value: 'D', label: 'Indigenous' }
]
