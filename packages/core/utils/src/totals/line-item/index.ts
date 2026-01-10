import { AdjustmentLineDTO, BigNumberInput, TaxLineDTO } from "@8medusa/types"
import { isDefined, pickValueFromObject } from "../../common"
import { calculateAdjustmentTotal } from "../adjustment"
import { BigNumber } from "../big-number"
import { MathBN } from "../math"
import { calculateTaxTotal } from "../tax"

interface GetLineItemsTotalsContext {
  includeTax?: boolean
  extraQuantityFields?: Record<string, string>
}

export interface GetItemTotalInput {
  id: string
  unit_price: BigNumber
  quantity: BigNumber
  is_tax_inclusive?: boolean
  tax_lines?: Pick<TaxLineDTO, "rate">[]
  adjustments?: Pick<AdjustmentLineDTO, "amount">[]
  detail?: {
    fulfilled_quantity: BigNumber
    delivered_quantity: BigNumber
    shipped_quantity: BigNumber
    return_requested_quantity: BigNumber
    return_received_quantity: BigNumber
    return_dismissed_quantity: BigNumber
    written_off_quantity: BigNumber
  }
}

export interface GetItemTotalOutput {
  quantity: BigNumber
  unit_price: BigNumber

  subtotal: BigNumber

  total: BigNumber
  original_total: BigNumber

  discount_total: BigNumber
  discount_subtotal: BigNumber
  discount_tax_total: BigNumber

  refundable_total?: BigNumber
  refundable_total_per_unit?: BigNumber

  tax_total: BigNumber
  original_tax_total: BigNumber

  fulfilled_total?: BigNumber
  shipped_total?: BigNumber
  return_requested_total?: BigNumber
  return_received_total?: BigNumber
  return_dismissed_total?: BigNumber
  write_off_total?: BigNumber
}

export function getLineItemsTotals(
  items: GetItemTotalInput[],
  context: GetLineItemsTotalsContext
) {
  const itemsTotals = {}

  let index = 0
  for (const item of items) {
    itemsTotals[item.id ?? index] = getLineItemTotals(item, {
      includeTax: context.includeTax || item.is_tax_inclusive,
      extraQuantityFields: context.extraQuantityFields,
    })
    index++
  }

  return itemsTotals
}

function setRefundableTotal(
  item: GetItemTotalInput,
  discountsTotal: BigNumberInput,
  totals: GetItemTotalOutput,
  context: GetLineItemsTotalsContext
) {
  const itemDetail = item.detail!
  const totalReturnedQuantity = MathBN.sum(
    itemDetail.return_requested_quantity ?? 0,
    itemDetail.return_received_quantity ?? 0,
    itemDetail.return_dismissed_quantity ?? 0
  )
  const currentQuantity = MathBN.sub(item.quantity, totalReturnedQuantity)

  // Use line-level calculation for refundable total
  const isTaxInclusive = item.is_tax_inclusive ?? context.includeTax
  const sumTax = MathBN.sum(
    ...((item.tax_lines ?? []).map((taxLine) => taxLine.rate) ?? [])
  )
  const sumTaxRate = MathBN.div(sumTax, 100)

  const unitNet = isTaxInclusive
    ? MathBN.div(item.unit_price, MathBN.add(1, sumTaxRate))
    : item.unit_price

  const discountPerUnit = MathBN.eq(item.quantity, 0)
    ? 0
    : MathBN.div(discountsTotal, item.quantity)

  // Compute refundable line net (high precision)
  const refundableLineNetExact = MathBN.mult(
    currentQuantity,
    MathBN.sub(unitNet, discountPerUnit)
  )

  // Round at line level (matches Helios algorithm)
  const refundableLineNetRounded = MathBN.round(refundableLineNetExact, 2)

  // Compute tax on rounded line net
  const taxTotal = calculateTaxTotal({
    taxLines: item.tax_lines || [],
    taxableAmount: refundableLineNetRounded,
  })

  const refundableTotal = MathBN.round(
    MathBN.add(refundableLineNetRounded, taxTotal),
    2
  )

  totals.refundable_total_per_unit = new BigNumber(
    MathBN.eq(currentQuantity, 0)
      ? 0
      : MathBN.div(refundableTotal, currentQuantity)
  )
  totals.refundable_total = new BigNumber(refundableTotal)
}

function getLineItemTotals(
  item: GetItemTotalInput,
  context: GetLineItemsTotalsContext
) {
  const isTaxInclusive = item.is_tax_inclusive ?? context.includeTax
  const sumTax = MathBN.sum(
    ...((item.tax_lines ?? []).map((taxLine) => taxLine.rate) ?? [])
  )

  const sumTaxRate = MathBN.div(sumTax, 100)

  /*
    Calculate unit subtotal (net price per unit)
    If the price is inclusive of tax, we need to remove the taxed amount from the subtotal
    Original Price = Total Price / (1 + Tax Rate)
  */
  const unitNet = isTaxInclusive
    ? MathBN.div(item.unit_price, MathBN.add(1, sumTaxRate))
    : item.unit_price

  const {
    adjustmentsTotal: discountsTotal,
    adjustmentsSubtotal: discountsSubtotal,
    adjustmentsTaxTotal: discountTaxTotal,
  } = calculateAdjustmentTotal({
    adjustments: item.adjustments || [],
    includesTax: isTaxInclusive,
    taxRate: sumTaxRate,
  })

  // LINE-LEVEL CALCULATION (Helios-compatible rounding)
  // Compute line net before discounts (high precision, no rounding)
  const lineNetBefore = MathBN.mult(unitNet, item.quantity)
  const subtotal = lineNetBefore

  // Apply discounts at line level (high precision)
  const lineNetAfterExact = MathBN.sub(lineNetBefore, discountsSubtotal)

  // CRITICAL ROUNDING POINT - Round at NET LINE level (matches Helios algorithm)
  // Helios reconstructs: lineNet = totalPrice / (1 + vatRate), then rounds to 2 decimals
  // By rounding here, we ensure Helios gets the same lineNet without additional drift
  const lineNetAfterRounded = MathBN.round(lineNetAfterExact, 2)

  // Compute tax on the rounded line net (ensures tax is based on the same value Helios uses)
  const taxTotal = calculateTaxTotal({
    taxLines: item.tax_lines || [],
    taxableAmount: lineNetAfterRounded,
    setTotalField: "total",
  })

  // Compute gross line total from rounded line net + tax
  const total = MathBN.round(MathBN.add(lineNetAfterRounded, taxTotal), 2)

  // Calculate original totals using line-level rounding (before discounts)
  const lineNetOriginalRounded = MathBN.round(lineNetBefore, 2)
  const originalTaxTotal = calculateTaxTotal({
    taxLines: item.tax_lines || [],
    taxableAmount: lineNetOriginalRounded,
    setTotalField: "total",
  })
  const originalTotal = MathBN.round(
    MathBN.add(lineNetOriginalRounded, originalTaxTotal),
    2
  )

  const totals: GetItemTotalOutput = {
    quantity: item.quantity,
    unit_price: item.unit_price,

    subtotal: new BigNumber(subtotal),
    total: new BigNumber(total),

    original_total: new BigNumber(originalTotal),

    discount_total: new BigNumber(discountsTotal),
    discount_subtotal: new BigNumber(discountsSubtotal),
    discount_tax_total: new BigNumber(discountTaxTotal),

    tax_total: new BigNumber(taxTotal),
    original_tax_total: new BigNumber(originalTaxTotal),
  }

  if (isDefined(item.detail?.return_requested_quantity)) {
    setRefundableTotal(item, discountsTotal, totals, context)
  }

  const div = MathBN.eq(item.quantity, 0) ? 1 : item.quantity
  const totalPerUnit = MathBN.div(totals.total, div)

  const optionalFields = {
    ...(context.extraQuantityFields ?? {}),
  }

  for (const field in optionalFields) {
    const totalField = optionalFields[field]

    let target = item[totalField]
    if (field.includes(".")) {
      target = pickValueFromObject(field, item)
    }

    if (!isDefined(target)) {
      continue
    }

    totals[totalField] = new BigNumber(MathBN.mult(totalPerUnit, target))
  }

  return totals
}
