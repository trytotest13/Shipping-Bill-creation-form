import { routes } from '@/shared/route-paths'
import { Form } from 'core/form/components'
import { navigate, useParams } from 'core/routing'
import { toast } from 'core/toast-manager'
import { useState } from 'react'
import { Button } from 'ui/basic/button'
import { Path } from 'ui/form'
import { Tabs, TabsList, TabsTrigger } from 'ui/interactive/tabs'
import { useSaveShippingBill } from '../hooks/use-save-shipping-bill'
import { useShippingBillForm } from '../hooks/use-shipping-bill-form'
import type { Branch, Business, Exporter, SavedBill, ShippingBillFormValues } from '../model'
import { shippingBillService } from '../services/shipping-bill-service'
import { saveBill, useDemoData } from '../store/demo-store'
import { BillFormFooter, BillTab } from './bill-form-footer'
import { BillFormHeader } from './bill-form-header'
import { BranchDialog } from './branch-dialog'
import { CargoSection } from './cargo-section'
import { DetailsSection } from './details-section'
import { DocumentsSection } from './documents-section'
import { InvoicesSection } from './invoices-section'
import { LicensesSection } from './licenses-section'
import { PartyDialog } from './party-dialog'
import { PartyBranchPath } from './party-fields'
import { PersistentTab } from './ui/persistent-tab'
import { WorkflowStepper } from './workflow-stepper'

interface QuickAddRequest {
  kind: 'exporter' | 'business'
  role?: 'consignee' | 'buyer' | 'thirdParty' | 'itemThirdParty'
  invoiceIndex?: number
  itemIndex?: number
}

interface QuickBranchRequest {
  kind: 'exporter' | 'business'
  ownerId: number
  branchName: PartyBranchPath
}

const tabTriggerClass =
  'rounded-lg px-4 py-2 text-sm font-bold transition-all hover:text-gray-950 aria-[selected=false]:text-gray-800 aria-[selected=true]:bg-white aria-[selected=true]:text-gray-950 aria-[selected=true]:shadow-xs dark:aria-[selected=true]:bg-gray-200'

// Orchestrator: owns form shell state and quick-add dialogs; field groups render themselves.
function BillEditor({ bill }: { bill?: SavedBill }) {
  const { formCtx, activeTab, setActiveTab, draftId, setDraftId } = useShippingBillForm(bill)
  const handleSave = useSaveShippingBill({ bill, draftId, onDraftSaved: setDraftId })
  const [quickAdd, setQuickAdd] = useState<QuickAddRequest | null>(null)
  const [quickBranch, setQuickBranch] = useState<QuickBranchRequest | null>(null)
  const { setValue } = formCtx.hooks

  function saveDraft() {
    const saved = saveBill(formCtx.hooks.getValues(), draftId)
    setDraftId(saved.id)
    return saved
  }

  function handleQuickSaved(party: Exporter | Business) {
    const branchId = party.branches[0]?.id
    if (!quickAdd || !branchId) return
    if (quickAdd.kind === 'exporter') {
      setValue('exporterId', String(party.id), { shouldValidate: true })
      setValue('exporterBranchId', String(branchId), { shouldValidate: true })
    } else if (quickAdd.role === 'consignee') {
      setValue('consigneeId', String(party.id), { shouldValidate: true })
      setValue('consigneeBranchId', String(branchId), { shouldValidate: true })
    } else if (quickAdd.role === 'itemThirdParty' && quickAdd.invoiceIndex != null && quickAdd.itemIndex != null) {
      setValue(`invoices.${quickAdd.invoiceIndex}.items.${quickAdd.itemIndex}.itemThirdPartyId`, String(party.id), {
        shouldValidate: true
      })
      setValue(
        `invoices.${quickAdd.invoiceIndex}.items.${quickAdd.itemIndex}.itemThirdPartyBranchId`,
        String(branchId),
        { shouldValidate: true }
      )
    } else if (quickAdd.invoiceIndex != null) {
      const field = quickAdd.role === 'buyer' ? 'buyer' : 'thirdParty'
      setValue(`invoices.${quickAdd.invoiceIndex}.${field}Id`, String(party.id), { shouldValidate: true })
      setValue(`invoices.${quickAdd.invoiceIndex}.${field}BranchId`, String(branchId), { shouldValidate: true })
    }
  }

  function handleQuickBranchSaved(branch: Branch) {
    if (!quickBranch) return
    setValue(quickBranch.branchName as Path<ShippingBillFormValues>, String(branch.id), { shouldValidate: true })
  }

  function goToTab(tab: BillTab) {
    saveDraft()
    setActiveTab(tab)
  }

  return (
    <div className="space-y-6">
      <BillFormHeader bill={bill} />
      <WorkflowStepper />
      <Form ctx={formCtx} handleSubmit={handleSave} className="space-y-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as BillTab)}>
          <TabsList className="flex w-full justify-start gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-1.5">
            <TabsTrigger value="details" className={tabTriggerClass}>
              1. Details
            </TabsTrigger>
            <TabsTrigger value="invoices" className={tabTriggerClass}>
              2. Invoices &amp; goods
            </TabsTrigger>
            <TabsTrigger value="documents" className={tabTriggerClass}>
              3. Others
            </TabsTrigger>
          </TabsList>

          <PersistentTab value="details" activeTab={activeTab} className="space-y-4">
            <DetailsSection
              onQuickAdd={(kind, role) => setQuickAdd({ kind, role })}
              onAddBranch={(kind, ownerId) =>
                setQuickBranch({
                  kind,
                  ownerId,
                  branchName: kind === 'exporter' ? 'exporterBranchId' : 'consigneeBranchId'
                })
              }
            />
          </PersistentTab>

          <PersistentTab value="invoices" activeTab={activeTab} className="space-y-4">
            <InvoicesSection
              onQuickAdd={(role, invoiceIndex, itemIndex) =>
                setQuickAdd({ kind: 'business', role, invoiceIndex, itemIndex })
              }
              onAddBranch={(ownerId, branchName) => setQuickBranch({ kind: 'business', ownerId, branchName })}
            />
          </PersistentTab>

          <PersistentTab value="documents" activeTab={activeTab} className="space-y-4">
            <CargoSection />
            <DocumentsSection />
            <LicensesSection />
          </PersistentTab>
        </Tabs>
        <BillFormFooter
          activeTab={activeTab}
          onPrevious={() => goToTab(activeTab === 'documents' ? 'invoices' : 'details')}
          onNext={() => {
            saveDraft()
            toast.success('Details saved')
            setActiveTab(activeTab === 'details' ? 'invoices' : 'documents')
          }}
        />
      </Form>
      {quickAdd && (
        <PartyDialog
          key={`${quickAdd.kind}-${quickAdd.role ?? 'exporter'}-${quickAdd.invoiceIndex ?? 0}`}
          kind={quickAdd.kind}
          initialRole={quickAdd.role === 'itemThirdParty' ? 'thirdParty' : quickAdd.role}
          onClose={() => setQuickAdd(null)}
          onSaved={handleQuickSaved}
        />
      )}
      {quickBranch && (
        <BranchDialog
          key={`${quickBranch.kind}-${quickBranch.ownerId}`}
          kind={quickBranch.kind}
          ownerId={quickBranch.ownerId}
          onClose={() => setQuickBranch(null)}
          onSaved={handleQuickBranchSaved}
        />
      )}
    </div>
  )
}

export default function ShippingBillPage() {
  const { id } = useParams<{ id?: string }>()
  const { bills } = useDemoData()
  const bill = id ? (bills.find((item) => item.id === Number(id)) ?? shippingBillService.getById(id)) : undefined
  if (id && !bill)
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Shipping bill not found</h1>
        <Button onClick={() => navigate(routes.dashboard)}>Back to list</Button>
      </div>
    )
  return <BillEditor key={id ?? 'new'} bill={bill} />
}
