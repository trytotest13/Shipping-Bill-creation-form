import { formatAmount, textOr } from '@/shared/format'
import { routes } from '@/shared/route-paths'
import { navigate } from 'core/routing'
import { Button } from 'ui/basic/button'
import { Table } from 'ui/basic/table'
import { invoiceTotal, SavedBill } from '../shipping-bills/model'

interface BillsTableProps {
  bills: SavedBill[]
  downloadingId: number | null
  onDownloadFlatFile: (bill: SavedBill) => void
}

export function BillsTable({ bills, downloadingId, onDownloadFlatFile }: BillsTableProps) {
  return (
    <Table>
      <thead className="border-b border-gray-300 bg-gray-100/75 dark:border-gray-700 dark:bg-gray-800/75">
        <tr>
          <th className="py-2.5 font-bold text-gray-950">Job</th>
          <th className="py-2.5 font-bold text-gray-950">Exporter → Consignee</th>
          <th className="py-2.5 font-bold text-gray-950">Route</th>
          <th className="py-2.5 font-bold text-gray-950">Invoices</th>
          <th className="py-2.5 font-bold text-gray-950">Status</th>
          <th className="py-2.5 font-bold text-gray-950">Updated</th>
          <th className="py-2.5 text-right font-bold text-gray-950">Action</th>
        </tr>
      </thead>
      <tbody>
        {bills.map((bill) => (
          <BillRow key={bill.id} bill={bill} downloadingId={downloadingId} onDownloadFlatFile={onDownloadFlatFile} />
        ))}
      </tbody>
    </Table>
  )
}

function BillRow({
  bill,
  downloadingId,
  onDownloadFlatFile
}: {
  bill: SavedBill
  downloadingId: number | null
  onDownloadFlatFile: (bill: SavedBill) => void
}) {
  const exporterName = textOr(bill.values.exporterName, '-')
  const consigneeName = textOr(bill.values.consigneeName, '-')
  const total = bill.values.invoices.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0)
  const updated =
    bill.updated && !isNaN(new Date(bill.updated).getTime()) ? new Date(bill.updated).toLocaleDateString() : '-'

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50/80 dark:border-gray-800 dark:hover:bg-gray-800/50">
      <td className="font-semibold text-gray-950">
        {bill.values.jobNumber ? `#${bill.values.jobNumber}` : `Bill #${bill.id}`}
        <span className="block text-xs font-medium text-gray-800">{bill.values.jobDate}</span>
      </td>
      <td className="font-medium text-gray-950">
        {exporterName}
        <span className="block text-xs font-normal text-gray-800">to {consigneeName}</span>
      </td>
      <td className="font-medium text-gray-950">
        {bill.values.loadingPort || '-'} → {bill.values.finalDestinationPort || '-'}
      </td>
      <td className="font-semibold text-gray-950">
        {bill.values.invoices.length}
        <span className="block text-xs font-medium text-gray-800">{formatAmount(total)} across items</span>
      </td>
      <td>
        <span className="inline-flex items-center rounded-md border border-gray-300 bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-950 dark:border-gray-700 dark:bg-gray-800">
          Draft
        </span>
      </td>
      <td className="text-sm font-medium text-gray-800">{updated}</td>
      <td className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={downloadingId === bill.id}
            onClick={() => onDownloadFlatFile(bill)}>
            {downloadingId === bill.id ? 'Downloading...' : 'Flat File'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(routes.toShippingBillEdit(bill.id))}>
            Open
          </Button>
        </div>
      </td>
    </tr>
  )
}
