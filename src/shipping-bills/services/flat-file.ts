import { textOr } from '@/shared/format'
import { SavedBill } from '../model'

function sanitizeFlatFileValue(value: string) {
  return value.replace(/[\^\r\n]+/g, ' ')
}

// ICEGATE-style flat file: <TABLE>/<F>/<R> records separated by ^, one HREC/TREC envelope pair.
export function generateFlatFileContent(bill: SavedBill): string {
  const v = bill.values
  const lines: string[] = []

  lines.push(`HREC**ZZ*${textOr(v.loadingPort, 'INMUN1')}*ZZ*ICEGATE*01*SB*1.0*`)
  lines.push(`<TABLE>SHIPPING_BILL`)
  lines.push(
    `<F>MESSAGE_TYPE^CHA_ID^JOB_NO^JOB_DATE^EXPORTER_ID^EXPORTER_BRANCH^CONSIGNEE_ID^LOADING_PORT^DEST_PORT^DISCHARGE_PORT^SEAL_TYPE^NATURE_OF_CARGO^GROSS_WEIGHT^NET_WEIGHT^UOM^PACKAGES^MARKS`
  )
  lines.push(
    `<R>F^1000^${textOr(v.jobNumber, String(bill.id))}^${textOr(v.jobDate, '')}^${textOr(v.exporterId, '')}^${textOr(v.exporterBranchId, '')}^${textOr(v.consigneeId, '')}^${textOr(v.loadingPort, '')}^${textOr(v.finalDestinationPort, '')}^${textOr(textOr(v.dischargePort, v.finalDestinationPort), '')}^${textOr(v.sealType, '')}^${textOr(v.natureOfCargo, '')}^${textOr(v.grossWeight, '')}^${textOr(v.netWeight, '')}^${textOr(v.measurementUnit, 'KGS')}^${textOr(v.totalPackages, '')}^${sanitizeFlatFileValue(textOr(v.marksAndNumbers, ''))}`
  )

  if (v.invoices.length > 0) {
    lines.push(`<TABLE>INVOICE`)
    lines.push(`<F>INVOICE_SN^INVOICE_NO^INVOICE_DATE^CURRENCY^CONTRACT_TYPE^BUYER_ID^FREIGHT_AMOUNT^INSURANCE_AMOUNT`)
    v.invoices.forEach((invoice, invoiceIndex) => {
      lines.push(
        `<R>${invoiceIndex + 1}^${textOr(invoice.invoiceNumber, '')}^${textOr(invoice.invoiceDate, '')}^${textOr(invoice.currency, 'USD')}^${textOr(invoice.contractType, '1')}^${textOr(invoice.buyerId, v.consigneeId)}^${textOr(invoice.freightAmount, '0')}^${textOr(invoice.insuranceAmount, '0')}`
      )
    })

    lines.push(`<TABLE>ITEM`)
    lines.push(`<F>INVOICE_SN^ITEM_SN^RITC_CODE^DESCRIPTION^QUANTITY^UOM^UNIT_PRICE^LINE_TOTAL^SCHEME_CODE`)
    v.invoices.forEach((invoice, invoiceIndex) => {
      invoice.items.forEach((item, itemIndex) => {
        const total = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
        lines.push(
          `<R>${invoiceIndex + 1}^${itemIndex + 1}^${textOr(item.ritcCode, '')}^${sanitizeFlatFileValue(textOr(item.goodsDescription1, ''))}^${textOr(item.quantity, '')}^${textOr(item.unitOfMeasurement, 'PCS')}^${textOr(item.unitPrice, '')}^${total.toFixed(2)}^${textOr(item.schemeCode, '')}`
        )
      })
    })
  }

  if (v.packingRanges.length > 0) {
    lines.push(`<TABLE>PACKING`)
    lines.push(`<F>FROM_PKG^TO_PKG^PKG_CODE`)
    v.packingRanges.forEach((range) => {
      lines.push(
        `<R>${textOr(range.packingNumberFrom, '')}^${textOr(range.packingNumberTo, '')}^${textOr(range.packingCode, 'CTN')}`
      )
    })
  }

  lines.push(`TREC**ZZ*${textOr(v.loadingPort, 'INMUN1')}*ZZ*ICEGATE*01*SB*1.0*`)

  return lines.join('\r\n')
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => window.URL.revokeObjectURL(url), 1000)
}

export function downloadTextFile(content: string, filename: string) {
  triggerBlobDownload(new Blob([content], { type: 'text/plain;charset=utf-8' }), filename)
}

const filenameDispositionPattern = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/

export function filenameFromDisposition(disposition: string | null): string | undefined {
  const match = disposition?.includes('filename=') ? filenameDispositionPattern.exec(disposition) : null
  return match?.[1]?.replace(/['"]/g, '')
}

export function textFromJsonFlatFile(json: unknown): string {
  if (typeof json === 'string') return json
  if (json && typeof json === 'object') {
    const record = json as Record<string, unknown>
    const content = record.file ?? record.content ?? record.data
    if (typeof content === 'string') return content
  }
  return JSON.stringify(json, null, 2)
}
