import { useEffect } from 'react'
import { getFormContext } from 'ui/form'
import type { Business, Exporter } from '../model'
import { partyMockService } from '../services/party-mock-service'
import { getDemoData } from '../store/demo-store'
import { AsyncSearchSelect } from './async-search-select'

export type PartyOwnerPath =
  | 'exporterId'
  | 'consigneeId'
  | `invoices.${number}.buyerId`
  | `invoices.${number}.thirdPartyId`
  | `invoices.${number}.items.${number}.itemThirdPartyId`

export type PartyBranchPath =
  | 'exporterBranchId'
  | 'consigneeBranchId'
  | `invoices.${number}.buyerBranchId`
  | `invoices.${number}.thirdPartyBranchId`
  | `invoices.${number}.items.${number}.itemThirdPartyBranchId`

interface PartyFieldsProps {
  ownerName: PartyOwnerPath
  branchName: PartyBranchPath
  label: string
  kind: 'exporter' | 'business'
  parties: (Exporter | Business)[]
  required?: boolean
  onAddBranch: (ownerId: number) => void
  onQuickAdd: () => void
}

// Paired party + branch pickers. The branch list depends on the selected party.
export function PartyFields({
  ownerName,
  branchName,
  label,
  kind,
  parties,
  required = true,
  onAddBranch,
  onQuickAdd
}: PartyFieldsProps) {
  const { watch, getValues, setValue } = getFormContext().hooks
  const ownerId = watch(ownerName)
  const { exporters, businesses } = getDemoData()
  const candidates = kind === 'exporter' ? exporters : businesses
  const owner =
    candidates.find((party) => String(party.id) === ownerId) ?? parties.find((party) => String(party.id) === ownerId)

  // Clear a stale branch whenever the selected party no longer owns it.
  useEffect(() => {
    const selectedBranch = getValues(branchName)
    if (
      selectedBranch &&
      owner &&
      owner.branches.length > 0 &&
      !owner.branches.some((branch) => String(branch.id) === selectedBranch)
    ) {
      setValue(branchName, '', { shouldValidate: true })
    }
  }, [branchName, getValues, setValue, owner])

  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-gray-950">{label}</span>
          <button
            type="button"
            className="text-primary-700 dark:text-primary-400 text-xs font-semibold hover:underline"
            onClick={onQuickAdd}>
            + Add new
          </button>
        </div>
        <AsyncSearchSelect
          name={ownerName}
          placeholder={`Search & select ${kind}...`}
          rules={{ required }}
          fetchOptions={async (query) => {
            const results =
              kind === 'exporter'
                ? await partyMockService.searchExporters(query)
                : await partyMockService.searchConsignees(query)
            return results.map((item) => ({
              value: String(item.id),
              label: item.name,
              sublabel: kind === 'exporter' && item.iec ? `IEC: ${item.iec}` : undefined
            }))
          }}
          getInitialLabel={async (id) => {
            const item =
              kind === 'exporter'
                ? await partyMockService.getExporterById(id)
                : await partyMockService.getConsigneeById(id)
            return item?.name ?? ''
          }}
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-gray-950">Branch / address</span>
          {owner && (
            <button
              type="button"
              className="text-primary-700 dark:text-primary-400 text-xs font-semibold hover:underline"
              onClick={() => onAddBranch(owner.id)}>
              + Add branch
            </button>
          )}
        </div>
        <AsyncSearchSelect
          name={branchName}
          placeholder={owner ? 'Search & select branch...' : `Choose ${kind} first`}
          disabled={!owner}
          rules={{ required: required || !!ownerId }}
          deps={[ownerId]}
          fetchOptions={async (query) => {
            if (!ownerId) return []
            const results =
              kind === 'exporter'
                ? await partyMockService.searchExporterBranches(ownerId, query)
                : await partyMockService.searchConsigneeBranches(ownerId, query)
            return results.map((branch) => ({
              value: String(branch.id),
              label: `${branch.branchName} · ${branch.city}`,
              sublabel: branch.address1
            }))
          }}
          getInitialLabel={(id) => {
            const branch = owner?.branches.find((item) => String(item.id) === id)
            return Promise.resolve(branch ? `${branch.branchName} · ${branch.city}` : '')
          }}
        />
      </div>
    </div>
  )
}
