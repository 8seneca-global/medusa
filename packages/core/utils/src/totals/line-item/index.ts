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

  if (MathBN.eq(currentQuantity, 0)) {
    totals.refundable_total_per_unit = new BigNumber(0)
    totals.refundable_total = new BigNumber(0)
    return
  }

  const isTaxInclusive = item.is_tax_inclusive ?? context.includeTax
  const sumTax = MathBN.sum(
    ...((item.tax_lines ?? []).map((taxLine) => taxLine.rate) ?? [])
  )

  const sumTaxRate = MathBN.div(sumTax, 100)
  const vatMul = MathBN.add(1, sumTaxRate)

  // Derive unitNet (same as main calculation)
  const unitNet = isTaxInclusive
    ? MathBN.div(item.unit_price, vatMul)
    : item.unit_price

  // Calculate refundable line net (for current quantity, not returned)
  const refundableLineNet = MathBN.mult(unitNet, currentQuantity)
  const refundableLineNetRounded = MathBN.round(refundableLineNet, 2)

  // Calculate discount per unit and apply to refundable quantity
  const discountPerUnit = MathBN.div(discountsTotal, item.quantity)
  const refundableDiscount = MathBN.mult(discountPerUnit, currentQuantity)

  // Subtract discount from net
  const refundableNetAfterDiscount = MathBN.sub(
    refundableLineNetRounded,
    refundableDiscount
  )

  // Calculate tax on refundable net (after discount)
  const taxTotal = calculateTaxTotal({
    taxLines: item.tax_lines || [],
    taxableAmount: refundableNetAfterDiscount,
  })
  const taxTotalRounded = MathBN.round(taxTotal, 2)

  // Calculate refundable gross total
  const refundableTotal = MathBN.round(
    MathBN.add(refundableNetAfterDiscount, taxTotalRounded),
    2
  )

  totals.refundable_total_per_unit = new BigNumber(
    MathBN.div(refundableTotal, currentQuantity)
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
  const vatMul = MathBN.add(1, sumTaxRate)

  /*
    A) Derive vatRate and unitNet
    If the price is inclusive of tax, we need to remove the taxed amount
    unitNet = unitGross / (1 + vatRate)
    DO NOT round unitNet - keep high precision for line-level calculation
  */
  const unitNet = isTaxInclusive
    ? MathBN.div(item.unit_price, vatMul)
    : item.unit_price

  /*
    B) Compute line net BEFORE promotions (pre-promo base)
    lineNetBefore = qty × unitNet (high precision, no rounding yet)
  */
  const lineNetBefore = MathBN.mult(unitNet, item.quantity)

  /*
    C) CRITICAL: Round at NET LINE level to match Helios rounding point
    Helios will do: round2(totalPrice / (1 + vatRate))
    We ensure consistency by rounding the net base at LINE level, NOT unit level.
    This is the key alignment point that prevents rounding drift.
  */
  const lineNetBeforeRounded = MathBN.round(lineNetBefore, 2)

  /*
    D) Compute tax on the PRE-PROMO net (tax is NOT affected by promotions)
    Tax must be calculated from lineNetBeforeRounded (not unit, not discounted net)
  */
  const lineTax = calculateTaxTotal({
    taxLines: item.tax_lines || [],
    taxableAmount: lineNetBeforeRounded,
    setTotalField: "total",
  })
  const lineTaxRounded = MathBN.round(lineTax, 2)

  /*
    E) Compute original (pre-promo) gross line total
    This is what the customer would pay without any promotions
  */
  const lineGrossBeforePromo = MathBN.round(
    MathBN.add(lineNetBeforeRounded, lineTaxRounded),
    2
  )

  /*
    F) Compute promo/discount on GROSS (post-tax reduction)
    Promotions are applied to customer-facing gross totals, not to the taxable base.
    - Percentage promos are computed on lineGrossBeforePromo (gross), not on net
    - Fixed promos are subtracted from gross after percentage is computed
    - Tax is NOT recalculated after applying promo
  */
  const { adjustmentsTotal: promoGross } = calculateAdjustmentTotal({
    adjustments: item.adjustments || [],
    includesTax: true, // Force gross interpretation - promotions reduce customer-facing price
    taxRate: sumTaxRate,
  })

  /*
    G) Compute final total (gross after promo)
    This is the totalPrice we sync to Helios
  */
  const total = MathBN.round(MathBN.sub(lineGrossBeforePromo, promoGross), 2)

  /*
    H) Prepare output fields
    - subtotal: line net before promo (for consistency with existing API)
    - total: gross line total after promo (synced to Helios as totalPrice)
    - original_total: gross line total before promo
    - original_tax_total: tax on pre-promo amounts
    - tax_total: same as original_tax_total (tax doesn't change with promo)
    - discount_total: gross discount amount
    - discount_subtotal: net discount amount (derived)
    - discount_tax_total: tax component of discount (derived)
  */
  const totals: GetItemTotalOutput = {
    quantity: item.quantity,
    unit_price: item.unit_price,

    subtotal: new BigNumber(lineNetBeforeRounded),
    total: new BigNumber(total),

    original_total: new BigNumber(lineGrossBeforePromo),

    discount_total: new BigNumber(promoGross),
    discount_subtotal: new BigNumber(promoGross), // Same as discount_total - promotions apply to gross amounts
    discount_tax_total: new BigNumber(0), // No tax on discount - promotions reduce post-tax totals

    tax_total: new BigNumber(lineTaxRounded),
    original_tax_total: new BigNumber(lineTaxRounded),
  }

  if (isDefined(item.detail?.return_requested_quantity)) {
    setRefundableTotal(item, promoGross, totals, context)
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
