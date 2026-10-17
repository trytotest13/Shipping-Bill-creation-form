# Schema — Shipping Bill Domain (from model.ts + demo-store.ts)

## 1. Collections (localStorage mock `export-software-shipping-bills-v2` + API shape)

- `exporters: Exporter[]`, `businesses: Business[]`, `bills: SavedBill[]`
- Static lookups in `src/data/*`: `e-sanchit-codes`, `quantity-code`, `scheme-codes`, `states`, `trade-agrements`, `types` (cargoOptions, contractTypes, paymentTypes, priceInclusionTypes, sealTypes, weightUnits)

## 2. Types (TS interfaces, PKs/FKs)

- `Branch { id:number PK, branchName, address1, address2?, city, state?, pincode?, countryCode, email?, mobile?, gstnId?, adCode?, accountNo?, ifscCode? }` FK: owner exporter/business id
- `Exporter { id:number PK, name, iec, class, type, pan?, tan?, aeoNumber?, website?, notes?, disabled?, branches:Branch[] }`
- `Business { id:number PK, name, iec?, isConsignee, isBuyer, isNotify, isThirdParty, branches:Branch[] }`
- `PortOption { code:string PK (e.g. INNSA1), name, countryCode }`; `loadingPorts` (IN) vs `ports` (US/DE/AE/SG discharge)
- `BillItemForm` (70+ string fields: ritcCode PK-ish per row, goodsDescription1, quantity, unitOfMeasurement, unitPrice, schemeCode, drawback/rosctl/rodtep/cess/tradeAgreementsCode etc.)
- `BillInvoiceForm { invoiceNumber, invoiceDate, currency, contractType, buyerSameAsConsignee:boolean, buyerId, buyerBranchId, thirdPartyId?, freight/insurance/commission/discount/otherDeductions + currencies, packingCharges, natureOfPayment, items:BillItemForm[] }`
- `ShippingBillFormValues { jobNumber?, jobDate, exporterId FK->Exporter, exporterBranchId FK->Branch, consigneeId FK->Business, consigneeBranchId, loadingPort FK->loadingPorts.code, finalDestinationPort, dischargePort?, originStateCode?, sealType?, containers[], packingRanges[], documents[], licenses[], invoices[] + header duplicates for single-invoice compat }`
- `SavedBill { id:number PK, created:string ISO, updated:string ISO, values:ShippingBillFormValues, payload:ToShippingBillPayload }`

## 3. Relationships

- Exporter 1—N Branch; Business 1—N Branch; Bill N—1 Exporter/Business/Branch (by string id refs, validated in UI, guarded on delete)
- Bill 1—N Invoices 1—N Items; Bill 1—N Containers/PackingRanges/Documents/Licenses
- `deleteParty/deleteBranch` blocks if `bills[].values` references id (returns false → toast).

## 4. Payload Transforms (API boundary)

- `toShippingBillPayload(values)` (local save) + `toHttpShippingBillPayload(values)` (POST): `parseNum(''→undefined)`, `parseDate→epoch-days (ms/86400000)`, `CURRENCY_MAP`, `KG→KGS`, serial numbers `index+1`, flatMaps for third_party/ar4_details, docs/licenses maps.
- `normalizeApiBills(data)` for GET list → `SavedBill[]`.

## 5. Indexes / Policies

- Local: Map by `id` for overlay (`syncBillsFromApi`), `nextId()` for new ids.
- Security: No real DB; API uses static `Authorization:tenantId=1000&user=1000&role=1` header (placeholder, must stay in env, never hardcode prod secret). No PII beyond demo seed.

## 6. Seed Data Notes

- 6 exporters (Aarav Textiles 1000, Blue Harbor 1002, Apex 1010, Zenith 1020, Titanium 1030, Evergreen 1040) each 2 branches; businesses mirror consignee/buyer/notify roles; `emptyBill()` defaults jobDate=today, currency USD/INR, contractType FOB-ish.
