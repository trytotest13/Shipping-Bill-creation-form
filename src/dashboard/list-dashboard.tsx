import { errorMessage } from '@/shared/errors'
import { textOr } from '@/shared/format'
import { routes } from '@/shared/route-paths'
import { navigate } from 'core/routing'
import { toast } from 'core/toast-manager'
import { useEffect, useState } from 'react'
import { Button } from 'ui/basic/button'
import { Card, CardContent } from 'ui/basic/card'
import { Input } from 'ui/inputs/input'
import type { SavedBill } from '../shipping-bills/model'
import { shippingBillService } from '../shipping-bills/services/shipping-bill-service'
import { countUnique, filterBills, sortBillsByUpdated } from './bill-filters'
import { BillsTable } from './bills-table'
import { StatCards } from './stat-cards'

// Dashboard: lists saved bills with search, stats and flat-file download per row.
export default function ListDashboard() {
  const [bills, setBills] = useState<SavedBill[]>(() => shippingBillService.getInitialBills())
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    async function fetchBills() {
      setIsLoading(true)
      try {
        const remoteBills = await shippingBillService.list()
        if (active && remoteBills.length > 0) {
          setBills(remoteBills)
          toast.success(`Loaded ${remoteBills.length} shipping bills`)
        }
      } catch (error) {
        console.warn('Backend API listing notice:', error)
      } finally {
        if (active) setIsLoading(false)
      }
    }
    void fetchBills()
    return () => {
      active = false
    }
  }, [])

  async function handleDownloadFlatFile(bill: SavedBill) {
    try {
      setDownloadingId(bill.id)
      const result = await shippingBillService.downloadFlatFile(bill.id, bill)
      if (result.source === 'api') {
        toast.success('Flat file downloaded from backend API')
      } else {
        toast.success(`Flat file (.sb) generated and downloaded for #${textOr(bill.values.jobNumber, String(bill.id))}`)
      }
    } catch (error) {
      console.warn('Flat file notice:', errorMessage(error))
      toast.error('Failed to generate flat file')
    } finally {
      setDownloadingId(null)
    }
  }

  const filtered = sortBillsByUpdated(filterBills(bills, search))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-950">Shipping bills</h1>
          <p className="mt-1 text-sm text-gray-800">Create and continue the shipping bill step of each export job.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={reloadBills} disabled={isLoading}>
            {isLoading ? 'Syncing...' : 'Sync from API'}
          </Button>
          <Button onClick={() => navigate(routes.shippingBillNew)}>+ New shipping bill</Button>
        </div>
      </div>

      <StatCards
        billsCount={bills.length}
        exportersCount={countUnique(bills.map((bill) => bill.values.exporterName))}
        consigneesCount={countUnique(bills.map((bill) => bill.values.consigneeName))}
      />

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
            <BillsTable bills={filtered} downloadingId={downloadingId} onDownloadFlatFile={handleDownloadFlatFile} />
          ) : (
            <EmptyState hasSearch={Boolean(search)} />
          )}
        </CardContent>
      </Card>
    </div>
  )

  async function reloadBills() {
    setIsLoading(true)
    try {
      const remoteBills = await shippingBillService.list()
      if (remoteBills.length > 0) {
        setBills(remoteBills)
        toast.success(`Loaded ${remoteBills.length} shipping bills`)
      }
    } catch (error) {
      console.warn('Backend API listing notice:', error)
    } finally {
      setIsLoading(false)
    }
  }
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
      <p className="font-medium">{hasSearch ? 'No matching shipping bills' : 'No shipping bills yet'}</p>
      <p className="mt-1 text-sm text-gray-800">
        {hasSearch ? 'Try another job number or party name.' : 'Create a bill to start an export job.'}
      </p>
      {!hasSearch && (
        <Button className="mt-4" onClick={() => navigate(routes.shippingBillNew)}>
          Create shipping bill
        </Button>
      )}
    </div>
  )
}
