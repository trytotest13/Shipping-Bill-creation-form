import { routes } from '@/shared/route-paths'
import { navigate } from 'core/routing'
import { Button } from 'ui/basic/button'

export type BillTab = 'details' | 'invoices' | 'documents'

const previousTab: Record<BillTab, BillTab | undefined> = {
  details: undefined,
  invoices: 'details',
  documents: 'invoices'
}

const nextTab: Record<BillTab, BillTab | undefined> = {
  details: 'invoices',
  invoices: 'documents',
  documents: undefined
}

interface BillFormFooterProps {
  activeTab: BillTab
  onPrevious: () => void
  onNext: () => void
}

export function BillFormFooter({ activeTab, onPrevious, onNext }: BillFormFooterProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-5">
      <Button variant="outline" type="button" onClick={() => navigate(routes.dashboard)}>
        Cancel
      </Button>
      <div className="flex items-center gap-2.5">
        {previousTab[activeTab] && (
          <Button variant="outline" type="button" onClick={onPrevious}>
            ← Previous
          </Button>
        )}
        {nextTab[activeTab] ? (
          <Button type="button" className="shadow-xs" onClick={onNext}>
            Save &amp; Next →
          </Button>
        ) : (
          <Button type="submit" className="shadow-xs">
            Save changes
          </Button>
        )}
      </div>
    </div>
  )
}
