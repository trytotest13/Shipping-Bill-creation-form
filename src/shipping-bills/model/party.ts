export interface Branch {
  id: number
  branchName: string
  address1: string
  address2?: string
  city: string
  state?: string
  pincode?: string
  countryCode: string
  email?: string
  mobile?: string
  gstnId?: string
  adCode?: string
  accountNo?: string
  ifscCode?: string
}

export interface Exporter {
  id: number
  name: string
  iec: string
  class: string
  type: string
  pan?: string
  tan?: string
  aeoNumber?: string
  website?: string
  notes?: string
  disabled?: boolean
  branches: Branch[]
}

export interface Business {
  id: number
  name: string
  iec?: string
  isConsignee: boolean
  isBuyer: boolean
  isNotify: boolean
  isThirdParty: boolean
  branches: Branch[]
}
