import { SavedBill } from '../shipping-bills/model'

function billSearchText(bill: SavedBill) {
  return [
    bill.id,
    bill.values.jobNumber,
    bill.values.exporterName,
    bill.values.consigneeName,
    ...bill.values.invoices.map((invoice) => invoice.invoiceNumber)
  ]
    .join(' ')
    .toLowerCase()
}

export function filterBills(bills: SavedBill[], query: string) {
  const search = query.toLowerCase()
  return bills.filter((bill) => billSearchText(bill).includes(search))
}

function updatedTime(bill: SavedBill) {
  const time = bill.updated ? new Date(bill.updated).getTime() : 0
  return isNaN(time) ? 0 : time
}

export function sortBillsByUpdated(bills: SavedBill[]) {
  return [...bills].sort((a, b) => updatedTime(b) - updatedTime(a))
}

export function countUnique(values: (string | undefined)[]) {
  return new Set(values.filter(Boolean)).size
}
