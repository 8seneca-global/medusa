import { AdjustmentLineDTO, TaxLineDTO } from "@8medusa/types"
import { calculateAdjustmentTotal } from "../adjustment"
import { BigNumber } from "../big-number"
import { MathBN } from "../math"
import { calculateTaxTotal } from "../tax"

interface GetShippingMethodsTotalsContext {
  includeTax?: boolean
}

export interface GetShippingMethodTotalInput {
  id: string
  amount: BigNumber
  is_tax_inclusive?: boolean
  tax_lines?: TaxLineDTO[]
  adjustments?: Pick<AdjustmentLineDTO, "amount">[]
}

export interface GetShippingMethodTotalOutput {
  amount: BigNumber

  subtotal: BigNumber

  total: BigNumber
  original_total: BigNumber

  discount_total: BigNumber
  discount_subtotal: BigNumber
  discount_tax_total: BigNumber

  tax_total: BigNumber
  original_tax_total: BigNumber
}

export function getShippingMethodsTotals(
  shippingMethods: GetShippingMethodTotalInput[],
  context: GetShippingMethodsTotalsContext
): Record<string, GetShippingMethodTotalOutput> {
  const shippingMethodsTotals = {}

  let index = 0
  for (const shippingMethod of shippingMethods) {
    shippingMethodsTotals[shippingMethod.id ?? index] = getShippingMethodTotals(
      shippingMethod,
      context
    )
    index++
  }

  return shippingMethodsTotals
}

export function getShippingMethodTotals(
  shippingMethod: GetShippingMethodTotalInput,
  context: GetShippingMethodsTotalsContext
) {
  const isTaxInclusive = shippingMethod.is_tax_inclusive ?? context.includeTax

  const shippingMethodAmount = MathBN.convert(shippingMethod.amount)
  const sumTax = MathBN.sum(
    ...(shippingMethod.tax_lines?.map((taxLine) => taxLine.rate) ?? [])
  )
  const sumTaxRate = MathBN.div(sumTax, 100)

  const subtotal = isTaxInclusive
    ? MathBN.div(shippingMethodAmount, MathBN.add(1, sumTaxRate))
    : shippingMethodAmount

  const { adjustmentsTotal: discountsTotal } = calculateAdjustmentTotal({
    adjustments: shippingMethod.adjustments || [],
    includesTax: isTaxInclusive,
    taxRate: sumTaxRate,
  })

  const taxLines = shippingMethod.tax_lines || []

  // Tax is calculated on original subtotal - not affected by discounts
  const originalTaxTotal = calculateTaxTotal({
    taxLines,
    taxableAmount: subtotal,
    setTotalField: "subtotal",
  })

  // Tax total is same as original - promotions don't reduce tax
  const taxTotal = originalTaxTotal

  // Original gross total (before promotions)
  const originalGrossTotal = isTaxInclusive
    ? shippingMethodAmount
    : MathBN.add(subtotal, originalTaxTotal)

  // Final total = original gross - discount (promotions reduce post-tax total)
  const total = MathBN.round(MathBN.sub(originalGrossTotal, discountsTotal), 2)

  const totals: GetShippingMethodTotalOutput = {
    amount: new BigNumber(shippingMethodAmount),

    subtotal: new BigNumber(subtotal),
    total: new BigNumber(total),
    original_total: new BigNumber(originalGrossTotal),

    discount_total: new BigNumber(discountsTotal),
    discount_subtotal: new BigNumber(discountsTotal), // Same as discount_total - promotions apply to gross
    discount_tax_total: new BigNumber(0), // No tax on discount - promotions reduce post-tax totals

    tax_total: new BigNumber(taxTotal),
    original_tax_total: new BigNumber(originalTaxTotal),
  }

  return totals
}
