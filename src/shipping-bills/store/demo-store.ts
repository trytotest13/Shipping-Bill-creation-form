import { useSyncExternalStore } from 'react'
import { Branch, Business, Exporter, SavedBill, ShippingBillFormValues, toShippingBillPayload } from '../model'
import { seedData } from './demo-seed'

export interface DemoData {
  exporters: Exporter[]
  businesses: Business[]
  bills: SavedBill[]
}

const storageKey = 'export-software-shipping-bills-v2'

function loadData(): DemoData {
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      const parsed = JSON.parse(raw) as DemoData
      if (Array.isArray(parsed.exporters) && Array.isArray(parsed.businesses) && Array.isArray(parsed.bills)) {
        // Merge missing seed masters into the parsed store so newly added demo parties appear.
        const knownExporterIds = new Set(parsed.exporters.map((exporter) => exporter.id))
        const missingExporters = seedData.exporters.filter((exporter) => !knownExporterIds.has(exporter.id))

        const knownBusinessIds = new Set(parsed.businesses.map((business) => business.id))
        const missingBusinesses = seedData.businesses.filter((business) => !knownBusinessIds.has(business.id))

        return {
          exporters: [...parsed.exporters, ...missingExporters],
          businesses: [...parsed.businesses, ...missingBusinesses],
          bills: parsed.bills.map((bill) => ({
            ...bill,
            values: {
              ...bill.values,
              packingRanges: (bill.values as Partial<ShippingBillFormValues>).packingRanges ?? []
            }
          }))
        }
      }
    }
  } catch {
    // Use sample data when local storage is unavailable or contains invalid data.
  }
  return seedData
}

let snapshot = loadData()
const listeners = new Set<() => void>()

function publish(next: DemoData) {
  snapshot = next
  try {
    localStorage.setItem(storageKey, JSON.stringify(next))
  } catch {
    // The in-memory demo remains usable when storage is disabled.
  }
  listeners.forEach((listener) => listener())
}

export function useDemoData() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => snapshot
  )
}

export function getDemoData() {
  return snapshot
}

function nextId() {
  const ids = [
    ...snapshot.exporters.flatMap((record) => [record.id, ...record.branches.map((branch) => branch.id)]),
    ...snapshot.businesses.flatMap((record) => [record.id, ...record.branches.map((branch) => branch.id)]),
    ...snapshot.bills.map((bill) => bill.id)
  ]
  return Math.max(3000, ...ids) + 1
}

export function saveExporter(
  exporter: Omit<Exporter, 'id' | 'branches'> & { id?: number; firstBranch?: Omit<Branch, 'id'> }
) {
  const id = exporter.id ?? nextId()
  const previous = snapshot.exporters.find((record) => record.id === id)
  const branches = previous?.branches ?? (exporter.firstBranch ? [{ ...exporter.firstBranch, id: id + 1 }] : [])
  const record: Exporter = {
    id,
    branches,
    name: exporter.name,
    iec: exporter.iec,
    class: exporter.class,
    type: exporter.type,
    pan: exporter.pan,
    tan: exporter.tan,
    aeoNumber: exporter.aeoNumber,
    website: exporter.website,
    notes: exporter.notes,
    disabled: exporter.disabled ?? previous?.disabled
  }
  publish({ ...snapshot, exporters: [...snapshot.exporters.filter((item) => item.id !== id), record] })
  return record
}

export function saveBusiness(
  business: Omit<Business, 'id' | 'branches'> & { id?: number; firstBranch?: Omit<Branch, 'id'> }
) {
  const id = business.id ?? nextId()
  const previous = snapshot.businesses.find((record) => record.id === id)
  const branches = previous?.branches ?? (business.firstBranch ? [{ ...business.firstBranch, id: id + 1 }] : [])
  const record: Business = {
    id,
    branches,
    name: business.name,
    iec: business.iec,
    isConsignee: business.isConsignee,
    isBuyer: business.isBuyer,
    isNotify: business.isNotify,
    isThirdParty: business.isThirdParty
  }
  publish({ ...snapshot, businesses: [...snapshot.businesses.filter((item) => item.id !== id), record] })
  return record
}

export function saveBranch(
  kind: 'exporter' | 'business',
  ownerId: number,
  branch: Omit<Branch, 'id'> & { id?: number }
) {
  const id = branch.id ?? nextId()
  const record = { ...branch, id }
  if (kind === 'exporter') {
    publish({ ...snapshot, exporters: upsertOwnerBranch(snapshot.exporters, ownerId, record) })
  } else {
    publish({ ...snapshot, businesses: upsertOwnerBranch(snapshot.businesses, ownerId, record) })
  }
  return record
}

interface OwnerRecord {
  id: number
  branches: Branch[]
}

function upsertOwnerBranch<T extends OwnerRecord>(collection: T[], ownerId: number, branch: Branch): T[] {
  return collection.map((owner) =>
    owner.id === ownerId
      ? { ...owner, branches: [...owner.branches.filter((item) => item.id !== branch.id), branch] }
      : owner
  )
}

function removeOwnerBranch<T extends OwnerRecord>(collection: T[], ownerId: number, branchId: number): T[] {
  return collection.map((owner) =>
    owner.id === ownerId ? { ...owner, branches: owner.branches.filter((branch) => branch.id !== branchId) } : owner
  )
}

function partyInUse(kind: 'exporter' | 'business', id: number) {
  return snapshot.bills.some((bill) =>
    kind === 'exporter'
      ? bill.values.exporterId === String(id)
      : bill.values.consigneeId === String(id) ||
        bill.values.invoices.some(
          (invoice) =>
            invoice.buyerId === String(id) ||
            invoice.thirdPartyId === String(id) ||
            invoice.items.some((item) => item.itemThirdPartyId === String(id))
        )
  )
}

function branchInUse(kind: 'exporter' | 'business', id: number) {
  return snapshot.bills.some((bill) =>
    kind === 'exporter'
      ? bill.values.exporterBranchId === String(id)
      : bill.values.consigneeBranchId === String(id) ||
        bill.values.invoices.some(
          (invoice) =>
            invoice.buyerBranchId === String(id) ||
            invoice.thirdPartyBranchId === String(id) ||
            invoice.items.some((item) => item.itemThirdPartyBranchId === String(id))
        )
  )
}

export function deleteParty(kind: 'exporter' | 'business', id: number) {
  if (partyInUse(kind, id)) return false
  publish({
    ...snapshot,
    exporters: kind === 'exporter' ? snapshot.exporters.filter((record) => record.id !== id) : snapshot.exporters,
    businesses: kind === 'business' ? snapshot.businesses.filter((record) => record.id !== id) : snapshot.businesses
  })
  return true
}

export function deleteBranch(kind: 'exporter' | 'business', ownerId: number, id: number) {
  if (branchInUse(kind, id)) return false
  if (kind === 'exporter') {
    publish({ ...snapshot, exporters: removeOwnerBranch(snapshot.exporters, ownerId, id) })
  } else {
    publish({ ...snapshot, businesses: removeOwnerBranch(snapshot.businesses, ownerId, id) })
  }
  return true
}

export function saveBill(values: ShippingBillFormValues, id?: number) {
  const now = new Date().toISOString()
  const previous = snapshot.bills.find((bill) => bill.id === id)
  const record: SavedBill = {
    id: id ?? nextId(),
    created: previous?.created ?? now,
    updated: now,
    values,
    payload: toShippingBillPayload(values)
  }
  publish({ ...snapshot, bills: [record, ...snapshot.bills.filter((bill) => bill.id !== id)] })
  return record
}

export function syncBillsFromApi(apiBills: SavedBill[]) {
  if (apiBills.length === 0) return
  const merged = new Map<number, SavedBill>()
  for (const bill of snapshot.bills) merged.set(bill.id, bill)
  for (const bill of apiBills) merged.set(bill.id, bill)
  publish({ ...snapshot, bills: Array.from(merged.values()) })
}
