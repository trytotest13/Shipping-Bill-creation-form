import { useFieldArray } from 'core/form'
import { useState } from 'react'
import { Button } from 'ui/basic/button'
import { Card, CardContent, CardHeader } from 'ui/basic/card'
import { getFormContext } from 'ui/form'
import { Input } from 'ui/inputs/input'
import { inputDateType } from '../input-date-type'
import { emptyDocument, SupportingDocForm } from '../model'
import {
  getDocumentCodeLabel,
  getFileTypeLabel,
  searchDocumentCodes,
  searchFileTypes
} from '../services/form-options-service'
import { AsyncSearchSelect } from './async-search-select'
import { Disclosure } from './ui/disclosure'

interface DocumentRowProps {
  index: number
  onRemove: () => void
}

// Reusable party code/name/address block for issuing and beneficiary details.
function PartyAddressFields({
  basePath,
  prefix,
  title
}: {
  basePath: `documents.${number}`
  prefix: 'issuingParty' | 'beneficiaryParty'
  title: string
}) {
  const { register } = getFormContext().hooks

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Input label={`${title} code`} {...register(`${basePath}.${prefix}Code`)} />
      <Input label={`${title} name`} {...register(`${basePath}.${prefix}Name`)} />
      <Input label={`${title} address line 1`} {...register(`${basePath}.${prefix}Address1`)} />
      <Input label={`${title} address line 2`} {...register(`${basePath}.${prefix}Address2`)} />
      <Input label={`${title} city`} {...register(`${basePath}.${prefix}City`)} />
      <Input label={`${title} postal code`} {...register(`${basePath}.${prefix}Pin`)} />
    </div>
  )
}

function DocumentRow({ index, onRemove }: DocumentRowProps) {
  const { register, watch } = getFormContext().hooks
  const basePath = `documents.${index}` as const
  const documentValues = watch(basePath) as SupportingDocForm | undefined

  const hasCustomDetails = [
    documentValues?.placeOfIssue,
    documentValues?.invoiceSerialNumber,
    documentValues?.itemSerialNumber,
    documentValues?.issuingPartyCode,
    documentValues?.issuingPartyName,
    documentValues?.issuingPartyAddress1,
    documentValues?.issuingPartyAddress2,
    documentValues?.issuingPartyCity,
    documentValues?.issuingPartyPin,
    documentValues?.beneficiaryPartyCode,
    documentValues?.beneficiaryPartyName,
    documentValues?.beneficiaryPartyAddress1,
    documentValues?.beneficiaryPartyAddress2,
    documentValues?.beneficiaryPartyCity,
    documentValues?.beneficiaryPartyPin,
    documentValues?.fileType,
    documentValues?.icegateId
  ].some(Boolean)

  const [showCustomDetails, setShowCustomDetails] = useState(hasCustomDetails)

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-950">Document {index + 1}</h3>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onRemove}>
          Remove
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <span className="mb-1 block text-sm font-medium text-gray-800">Document type code</span>
          <AsyncSearchSelect
            name={`${basePath}.documentTypeCode`}
            placeholder="Search document type..."
            fetchOptions={searchDocumentCodes}
            getInitialLabel={getDocumentCodeLabel}
          />
        </div>
        <Input label="Image reference number" {...register(`${basePath}.imageReferenceNumber`)} />
        <Input label="Issue date" type={inputDateType} {...register(`${basePath}.documentIssueDate`)} />
      </div>
      <Disclosure title="Issuing party and ICEGATE details" open={showCustomDetails} onToggle={setShowCustomDetails}>
        <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Reference number" {...register(`${basePath}.documentReferenceNumber`)} />
          <Input label="Expiry date" type={inputDateType} {...register(`${basePath}.documentExpiryDate`)} />
          <Input label="Invoice serial number" type="number" {...register(`${basePath}.invoiceSerialNumber`)} />
          <Input label="Item serial number" type="number" {...register(`${basePath}.itemSerialNumber`)} />
          <div>
            <span className="mb-1 block text-sm font-medium text-gray-800">File type</span>
            <AsyncSearchSelect
              name={`${basePath}.fileType`}
              placeholder="Search file type..."
              className="bg-transparent"
              fetchOptions={searchFileTypes}
              getInitialLabel={getFileTypeLabel}
            />
          </div>
          <Input label="Place of issue" {...register(`${basePath}.placeOfIssue`)} />
        </div>
        <Disclosure title="Issuing & Beneficiary">
          <div className="flex flex-col gap-6 pt-2">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-950">Issuing Details</h3>
              <PartyAddressFields basePath={basePath} prefix="issuingParty" title="Issuing party" />
            </div>
            <div className="border-t border-gray-100 pt-5">
              <h3 className="mb-3 text-sm font-semibold text-gray-950">Beneficiary Details</h3>
              <PartyAddressFields basePath={basePath} prefix="beneficiaryParty" title="Beneficiary party" />
            </div>
          </div>
        </Disclosure>
      </Disclosure>
    </div>
  )
}

// Tab 3b: supporting documents (e-Sanchit references).
export function DocumentsSection() {
  const { control } = getFormContext().hooks
  const {
    fields: documents,
    append: addDocument,
    remove: removeDocument
  } = useFieldArray({ control, name: 'documents' })

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-950">Supporting documents</h3>
          <p className="mt-1 text-sm text-gray-800">Add references when required for this shipment.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => addDocument(emptyDocument())}>
          + Add document
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {documents.length === 0 && (
          <Button variant="outline" size="sm" onClick={() => addDocument(emptyDocument())}>
            + Add document
          </Button>
        )}
        {documents.map((field, index) => (
          <DocumentRow key={field.id} index={index} onRemove={() => removeDocument(index)} />
        ))}
      </CardContent>
    </Card>
  )
}
