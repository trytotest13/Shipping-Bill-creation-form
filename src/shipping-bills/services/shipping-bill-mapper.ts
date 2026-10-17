import { textOr } from '@/shared/format'
import { emptyBill, emptyInvoice, SavedBill, ShippingBillFormValues } from '../model'

// The backend returns loose JSON with inconsistent shapes across endpoints.
// These helpers keep every parser inside this module so the rest of the app sees typed values.
type RawRecord = Record<string, unknown>

const MS_PER_DAY = 86400000

// ISO-style timestamps below 10^10 are seconds; above are milliseconds.
const SECONDS_THRESHOLD_MS = 10000000000

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim() !== '') return Number(value)
  return undefined
}

function toNumberOr(value: unknown, fallback: number): number {
  const parsed = toNumber(value)
  // `||` is avoided deliberately: a parsed NaN must also fall back.
  return parsed != null && !isNaN(parsed) ? parsed : fallback
}

function toNumberString(value: unknown, fallback = ''): string {
  const parsed = toNumber(value)
  return parsed != null ? String(parsed) : fallback
}

// Only stringifies primitives so objects never leak in as '[object Object]'.
function toText(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

function toEpochDaysString(value: unknown): string {
  if (typeof value === 'number') {
    const date = new Date(value * MS_PER_DAY)
    if (!isNaN(date.getTime())) return date.toISOString().split('T')[0]
  }
  return typeof value === 'string' && value.trim() !== '' ? value : ''
}

function toIsoString(value: unknown): string {
  if (value == null || value === '') return new Date().toISOString()
  if (typeof value === 'number') {
    const ms = value < SECONDS_THRESHOLD_MS ? value * 1000 : value
    const date = new Date(ms)
    return !isNaN(date.getTime()) ? date.toISOString() : new Date().toISOString()
  }
  if (typeof value === 'string') {
    const date = new Date(value)
    return !isNaN(date.getTime()) ? date.toISOString() : new Date().toISOString()
  }
  return new Date().toISOString()
}

function toArray(value: unknown): RawRecord[] {
  return Array.isArray(value) ? (value as RawRecord[]) : []
}

// ISO 4217 numeric codes used by POST /api/shipping-bills
const CURRENCY_CODES: Record<string, number | undefined> = {
  USD: 840,
  INR: 356,
  EUR: 978,
  AED: 784,
  GBP: 826,
  SGD: 702
}

const DEFAULT_CURRENCY_CODE = 840

function parseCurrency(code?: string) {
  if (!code) return DEFAULT_CURRENCY_CODE
  return CURRENCY_CODES[code] ?? toNumber(code) ?? DEFAULT_CURRENCY_CODE
}

/**
 * Transforms form values into the payload structure required by POST /api/shipping-bills
 * as defined in shipping_bill.http
 */
export function toHttpShippingBillPayload(values: ShippingBillFormValues) {
  return {
    chaId: 1000,
    jobDate: values.jobDate ? Math.floor(new Date(values.jobDate).getTime() / MS_PER_DAY) : undefined,
    exporterId: toNumber(values.exporterId),
    exporterBranchId: toNumber(values.exporterBranchId),
    consigneeId: toNumber(values.consigneeId),
    consigneeAddressId: toNumber(values.consigneeBranchId),
    originStateCode: toNumber(values.originStateCode),
    loadingPort: values.loadingPort,
    finalDestinationPort: values.finalDestinationPort,
    dischargePort: textOr(values.dischargePort, values.finalDestinationPort),
    sealType: toNumber(values.sealType),
    natureOfCargo: toNumber(values.natureOfCargo),
    grossWeight: toNumber(values.grossWeight),
    netWeight: toNumber(values.netWeight),
    measurementUnit: values.measurementUnit === 'KG' ? 'KGS' : values.measurementUnit,
    totalPackages: toNumber(values.totalPackages),
    marksAndNumbers: values.marksAndNumbers,
    loosePackets: toNumber(values.loosePackets),
    numberOfContainers:
      values.containers.length > 0 ? values.containers.length : toNumberOr(values.numberOfContainers, 0),
    invoices: values.invoices.map((invoice, index) => ({
      serialNumber: index + 1,
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.invoiceDate ? Math.floor(new Date(invoice.invoiceDate).getTime() / MS_PER_DAY) : undefined,
      currency: parseCurrency(invoice.currency),
      contractType: toNumber(invoice.contractType),
      buyerId: toNumber(invoice.buyerSameAsConsignee ? values.consigneeId : invoice.buyerId),
      buyerAddressId: toNumber(invoice.buyerSameAsConsignee ? values.consigneeBranchId : invoice.buyerBranchId),
      freightCurrency: parseCurrency(textOr(invoice.freightCurrency, invoice.currency)),
      freightAmount: toNumberOr(invoice.freightAmount, 0),
      insuranceCurrency: parseCurrency(textOr(invoice.insuranceCurrency, invoice.currency)),
      insuranceAmount: toNumberOr(invoice.insuranceAmount, 0),
      commissionCurrency: parseCurrency(textOr(invoice.commissionCurrency, invoice.currency)),
      commissionAmount: toNumberOr(invoice.commissionAmount, 0),
      discountCurrency: parseCurrency(textOr(invoice.discountCurrency, invoice.currency)),
      discountAmount: toNumberOr(invoice.discountAmount, 0),
      otherDeductionsCurrency: parseCurrency(textOr(invoice.otherDeductionsCurrency, invoice.currency)),
      otherDeductionsAmount: toNumberOr(invoice.otherDeductionsAmount, 0),
      freightInsauranceIncluded: toNumber(invoice.freightInsuranceIncluded),
      packingCharges: toNumberOr(invoice.packingCharges, 0),
      natureOfPayment: toNumber(invoice.natureOfPayment),
      periodOfPayment: toNumber(invoice.periodOfPayment),
      items: invoice.items.map((item, itemIndex) => ({
        itemSerialNumber: itemIndex + 1,
        schemeCode: item.schemeCode,
        ritcCode: item.ritcCode,
        goodsDescription: item.goodsDescription1,
        unitOfMeasurement: item.unitOfMeasurement,
        quantity: toNumber(item.quantity),
        unitPrice: toNumber(item.unitPrice),
        unitOfRate: textOr(item.unitOfRate, item.unitOfMeasurement),
        noOfUnits: toNumberOr(item.numberOfUnits, 1),
        presentMarketValue: toNumber(item.presentMarketValue),
        thirdParty: Boolean(item.thirdPartyItem),
        rewardItem: Boolean(item.rewardItem),
        totalPackage: toNumber(item.totalPackage),
        endUseOfItem: item.endUseOfItem,
        igstPaymentStatus: toNumber(item.igstPaymentStatus),
        originDistrictCode: toNumber(item.originDistrictCode),
        tradeAgreementsCode: item.tradeAgreementsCode,
        drawbackSerialNumber: item.drawbackSerialNumber,
        drawbackQuantity: toNumber(item.drawbackQuantity)
      }))
    })),
    packgingList: values.packingRanges.map((range) => ({
      packingNumberFrom: toNumber(range.packingNumberFrom),
      packingNumberTo: toNumber(range.packingNumberTo),
      packingCode: range.packingCode
    })),
    documents: values.documents.map((document, index) => ({
      invoiceSerialNumber: toNumberOr(document.invoiceSerialNumber, 1),
      itemSerialNumber: toNumberOr(document.itemSerialNumber, 1),
      serialNumber: index + 1,
      imageReferenceNumber: document.imageReferenceNumber,
      documentTypeCode: document.documentTypeCode,
      documentIssueDate: document.documentIssueDate
        ? Math.floor(new Date(document.documentIssueDate).getTime() / MS_PER_DAY)
        : undefined,
      useDefault: true,
      fileType: toNumberOr(document.fileType, 1)
    }))
  }
}

type RawBill = RawRecord & { id?: unknown }

export function normalizeApiBill(raw: unknown): SavedBill {
  if (!raw || typeof raw !== 'object') return { id: 0, created: '', updated: '', values: emptyBill() }
  const record = raw as RawBill

  // Bills already stored in the SavedBill shape (e.g. synced from demo-store) pass through.
  if (record.values && record.id) {
    return {
      ...record,
      updated: toIsoString(record.updated),
      created: toIsoString(record.created)
    } as SavedBill
  }

  const id = toNumber(record.id ?? record.shippingBillId) ?? Math.floor(Math.random() * 100000)
  const updated = toIsoString(record.updatedAt ?? record.updated ?? record.createdAt)
  const created = toIsoString(record.createdAt ?? record.created ?? updated)

  const invoices = toArray(record.invoices)
  return {
    id,
    created,
    updated,
    values: {
      ...emptyBill(),
      jobNumber: record.jobNumber != null ? toText(record.jobNumber) : `JOB-${id}`,
      jobDate: toEpochDaysString(record.jobDate) || new Date().toISOString().split('T')[0],
      exporterId: toNumberString(record.exporterId),
      exporterBranchId: toNumberString(record.exporterBranchId),
      exporterName: typeof record.exporterName === 'string' ? record.exporterName : '',
      consigneeId: toNumberString(record.consigneeId),
      consigneeBranchId: toNumberString(record.consigneeAddressId ?? record.consigneeBranchId),
      consigneeName: typeof record.consigneeName === 'string' ? record.consigneeName : '',
      originStateCode: toNumberString(record.originStateCode),
      loadingPort: typeof record.loadingPort === 'string' ? record.loadingPort : '',
      finalDestinationPort: textOr(
        typeof record.destinationPort === 'string' ? record.destinationPort : undefined,
        typeof record.finalDestinationPort === 'string' ? record.finalDestinationPort : ''
      ),
      dischargePort: textOr(
        textOr(
          typeof record.dischargePort === 'string' ? record.dischargePort : undefined,
          typeof record.destinationPort === 'string' ? record.destinationPort : ''
        ),
        typeof record.finalDestinationPort === 'string' ? record.finalDestinationPort : ''
      ),
      sealType: toNumberString(record.sealType, '3'),
      natureOfCargo: toNumberString(record.natureOfCargo, '1'),
      grossWeight: toNumberString(record.grossWeight),
      netWeight: toNumberString(record.netWeight),
      measurementUnit: typeof record.measurementUnit === 'string' ? record.measurementUnit : 'KGS',
      totalPackages: toNumberString(record.totalPackages),
      marksAndNumbers: typeof record.marksAndNumbers === 'string' ? record.marksAndNumbers : '',
      loosePackets: toNumberString(record.loosePackets, '0'),
      numberOfContainers: toNumberString(record.numberOfContainers, '0'),
      containers: [],
      invoices: invoices.length > 0 ? invoices.map(normalizeApiInvoice(id)) : [emptyInvoice()],
      packingRanges: toArray(record.packgingList ?? record.packingRanges).map((range) => ({
        packingNumberFrom: toNumberString(range.packingNumberFrom),
        packingNumberTo: toNumberString(range.packingNumberTo),
        packingCode: typeof range.packingCode === 'string' ? range.packingCode : 'CTN'
      })),
      documents: toArray(record.documents).map((document) => ({
        invoiceSerialNumber: toNumberString(document.invoiceSerialNumber, '1'),
        itemSerialNumber: toNumberString(document.itemSerialNumber, '1'),
        imageReferenceNumber: typeof document.imageReferenceNumber === 'string' ? document.imageReferenceNumber : '',
        documentTypeCode: typeof document.documentTypeCode === 'string' ? document.documentTypeCode : '',
        documentReferenceNumber:
          typeof document.documentReferenceNumber === 'string' ? document.documentReferenceNumber : '',
        documentIssueDate: toEpochDaysString(document.documentIssueDate) || new Date().toISOString().split('T')[0],
        fileType: toNumberString(document.fileType, '1')
      }))
    },
    // API rows keep their raw payload verbatim for reference; only the form values above are normalized.
    payload: record as unknown as SavedBill['payload']
  }
}

function normalizeApiInvoice(consigneeId: number) {
  return (invoice: RawRecord, index: number): ShippingBillFormValues['invoices'][number] => ({
    invoiceNumber: typeof invoice.invoiceNumber === 'string' ? invoice.invoiceNumber : `INV-${index + 1}`,
    invoiceDate: toEpochDaysString(invoice.date ?? invoice.invoiceDate) || new Date().toISOString().split('T')[0],
    currency: normalizeCurrency(invoice.currency),
    contractType: toNumberString(invoice.contractType, '1'),
    buyerId: toNumberString(invoice.buyerId),
    buyerBranchId: toNumberString(invoice.buyerAddressId ?? invoice.buyerBranchId),
    buyerSameAsConsignee: invoice.buyerId == null || toText(invoice.buyerId) === String(consigneeId),
    freightAmount: toNumberString(invoice.freightAmount),
    insuranceAmount: toNumberString(invoice.insuranceAmount),
    items: toArray(invoice.items).map((item) => ({
      schemeCode: typeof item.schemeCode === 'string' ? item.schemeCode : '',
      ritcCode: typeof item.ritcCode === 'string' ? item.ritcCode : '',
      goodsDescription1:
        typeof item.goodsDescription === 'string'
          ? item.goodsDescription
          : typeof item.goodsDescription1 === 'string'
            ? item.goodsDescription1
            : '',
      quantity: toNumberString(item.quantity),
      unitOfMeasurement: typeof item.unitOfMeasurement === 'string' ? item.unitOfMeasurement : 'PCS',
      unitPrice: toNumberString(item.unitPrice),
      unitOfRate: textOr(
        textOr(
          typeof item.unitOfRate === 'string' ? item.unitOfRate : undefined,
          typeof item.unitOfMeasurement === 'string' ? item.unitOfMeasurement : ''
        ),
        'PCS'
      ),
      numberOfUnits: toNumberString(item.noOfUnits, '1'),
      presentMarketValue: toNumberString(item.presentMarketValue),
      thirdPartyItem: Boolean(item.thirdParty),
      rewardItem: Boolean(item.rewardItem),
      totalPackage: toNumberString(item.totalPackage),
      endUseOfItem: typeof item.endUseOfItem === 'string' ? item.endUseOfItem : '',
      igstPaymentStatus: toNumberString(item.igstPaymentStatus, '2'),
      originDistrictCode: toNumberString(item.originDistrictCode),
      tradeAgreementsCode: typeof item.tradeAgreementsCode === 'string' ? item.tradeAgreementsCode : '',
      drawbackSerialNumber: typeof item.drawbackSerialNumber === 'string' ? item.drawbackSerialNumber : '',
      drawbackQuantity: toNumberString(item.drawbackQuantity)
    }))
  })
}

const ISO_CURRENCY_BY_CODE: Record<number, string> = Object.fromEntries(
  Object.entries(CURRENCY_CODES).map(([alpha, numeric]) => [numeric ?? -1, alpha])
)

function normalizeCurrency(value: unknown): string {
  const numeric = toNumber(value)
  const alpha = numeric != null ? ISO_CURRENCY_BY_CODE[numeric] : undefined
  return textOr(alpha ?? (typeof value === 'string' ? value : ''), 'USD')
}

export function normalizeApiBills(raw: unknown): SavedBill[] {
  const envelope = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : undefined
  const list = Array.isArray(raw)
    ? raw
    : [envelope?.data, envelope?.bills, envelope?.shippingBills, envelope?.items].find((candidate) =>
        Array.isArray(candidate)
      )
  return toArray(list).map(normalizeApiBill)
}
