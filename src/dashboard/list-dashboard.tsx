import { routes } from '@/shared/route-paths'
import { invoiceTotal, SavedBill } from '@/shipping-bills/model'
import { shippingBillService } from '@/shipping-bills/services/shipping-bill-service'
import { navigate } from 'core/routing'
import { toast } from 'core/toast-manager'
import { useEffect, useState } from 'react'
import { Button } from 'ui/basic/button'
import { Card, CardContent } from 'ui/basic/card'
import { Table } from 'ui/basic/table'
import { Input } from 'ui/inputs/input'

export default function ListDashboard() {
  const [bills, setBills] = useState<SavedBill[]>(() => shippingBillService.getInitialBills())
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  const fetchBills = async () => {
    setIsLoading(true)
    try {
      const remoteBills = await shippingBillService.list()
      if (remoteBills && remoteBills.length > 0) {
        setBills(remoteBills)
        toast.success(`Loaded ${remoteBills.length} shipping bills`)
      }
    } catch (err: any) {
      console.warn('Backend API listing notice:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBills()
  }, [])

  const handleDownloadFlatFile = async (bill: SavedBill) => {
    try {
      setDownloadingId(bill.id)
      const res = await shippingBillService.downloadFlatFile(bill.id, bill)
      if (res.source === 'api') {
        toast.success('Flat file downloaded from backend API')
      } else {
        toast.success(`Flat file (.sb) generated and downloaded for #${bill.values.jobNumber || bill.id}`)
      }
    } catch (err: any) {
      console.warn('Flat file notice:', err)
      toast.error('Failed to generate flat file')
    } finally {
      setDownloadingId(null)
    }
  }

  const filtered = bills
    .filter((bill) => {
      const exporter = bill.values.exporterName || ''
      const consignee = bill.values.consigneeName || ''
      return [
        bill.id,
        bill.values.jobNumber,
        exporter,
        consignee,
        ...bill.values.invoices.map((invoice) => invoice.invoiceNumber)
      ]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase())
    })
    .sort((a, b) => {
      const timeA = a.updated ? new Date(a.updated).getTime() : 0
      const timeB = b.updated ? new Date(b.updated).getTime() : 0
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA)
    })

  const uniqueExportersCount = new Set(bills.map((b) => b.values.exporterName).filter(Boolean)).size

  const uniqueConsigneesCount = new Set(bills.map((b) => b.values.consigneeName).filter(Boolean)).size

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-950">Shipping bills</h1>
          <p className="mt-1 text-sm text-gray-800">Create and continue the shipping bill step of each export job.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchBills} disabled={isLoading}>
            {isLoading ? 'Syncing...' : 'Sync from API'}
          </Button>
          <Button onClick={() => navigate(routes.shippingBillNew)}>+ New shipping bill</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border border-gray-300 dark:border-gray-800">
          <CardContent className="pt-5">
            <p className="text-xs font-semibold text-gray-800">Shipping bills</p>
            <p className="mt-1 text-2xl font-bold text-gray-950">{bills.length}</p>
          </CardContent>
        </Card>
        <Card className="border border-gray-300 dark:border-gray-800">
          <CardContent className="pt-5">
            <p className="text-xs font-semibold text-gray-800">Exporters</p>
            <p className="mt-1 text-2xl font-bold text-gray-950">{uniqueExportersCount || 1}</p>
          </CardContent>
        </Card>
        <Card className="border border-gray-300 dark:border-gray-800">
          <CardContent className="pt-5">
            <p className="text-xs font-semibold text-gray-800">Businesses / Consignees</p>
            <p className="mt-1 text-2xl font-bold text-gray-950">{uniqueConsigneesCount || 1}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-gray-300 dark:border-gray-800">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="w-full max-w-sm">
              <Input
                label="Search bills"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Job, invoice, exporter or consignee"
              />
            </div>
            <span className="text-sm font-semibold text-gray-800">
              {filtered.length} {filtered.length === 1 ? 'bill' : 'bills'}
            </span>
          </div>
          {filtered.length ? (
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
                {filtered.map((bill) => {
                  const exporterName = bill.values.exporterName || '—'
                  const consigneeName = bill.values.consigneeName || '—'
                  const total = bill.values.invoices.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0)
                  return (
                    <tr
                      key={bill.id}
                      className="border-b border-gray-200 hover:bg-gray-50/80 dark:border-gray-800 dark:hover:bg-gray-800/50">
                      <td className="font-semibold text-gray-950">
                        {bill.values.jobNumber ? `#${bill.values.jobNumber}` : `Bill #${bill.id}`}
                        <span className="block text-xs font-medium text-gray-800">{bill.values.jobDate}</span>
                      </td>
                      <td className="font-medium text-gray-950">
                        {exporterName}
                        <span className="block text-xs font-normal text-gray-800">to {consigneeName}</span>
                      </td>
                      <td className="font-medium text-gray-950">
                        {bill.values.loadingPort || '—'} → {bill.values.finalDestinationPort || '—'}
                      </td>
                      <td className="font-semibold text-gray-950">
                        {bill.values.invoices.length}
                        <span className="block text-xs font-medium text-gray-800">
                          {total.toLocaleString(undefined, { maximumFractionDigits: 2 })} across items
                        </span>
                      </td>
                      <td>
                        <span className="inline-flex items-center rounded-md border border-gray-300 bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-950 dark:border-gray-700 dark:bg-gray-800">
                          Draft
                        </span>
                      </td>
                      <td className="text-sm font-medium text-gray-800">
                        {bill.updated && !isNaN(new Date(bill.updated).getTime())
                          ? new Date(bill.updated).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={downloadingId === bill.id}
                            onClick={() => handleDownloadFlatFile(bill)}>
                            {downloadingId === bill.id ? 'Downloading...' : 'Flat File'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(routes.toShippingBillEdit(bill.id))}>
                            Open
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
              <p className="font-medium">{search ? 'No matching shipping bills' : 'No shipping bills yet'}</p>
              <p className="mt-1 text-sm text-gray-800">
                {search ? 'Try another job number or party name.' : 'Create a bill to start an export job.'}
              </p>
              {!search && (
                <Button className="mt-4" onClick={() => navigate(routes.shippingBillNew)}>
                  Create shipping bill
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
