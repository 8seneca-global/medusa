import { BigNumberInput } from "@8medusa/types"
import {
  ApplicationMethodAllocation,
  ApplicationMethodType,
} from "../../promotion"
import { MathBN } from "../math"

function getPromotionValueForPercentage(promotion, lineItemTotal) {
  return MathBN.mult(MathBN.div(promotion.value, 100), lineItemTotal)
}

function getPromotionValueForFixed(promotion, itemTotal, allItemsTotal) {
  if (promotion.allocation === ApplicationMethodAllocation.ACROSS) {
    const promotionValueForItem = MathBN.mult(
      MathBN.div(itemTotal, allItemsTotal),
      promotion.value
    )

    if (MathBN.lte(promotionValueForItem, itemTotal)) {
      return promotionValueForItem
    }

    const percentage = MathBN.div(
      MathBN.mult(itemTotal, 100),
      promotionValueForItem
    )

    return MathBN.mult(
      promotionValueForItem,
      MathBN.div(percentage, 100)
    ).precision(4)
  }

  return promotion.value
}

export function getPromotionValue(promotion, lineItemTotal, lineItemsTotal) {
  if (promotion.type === ApplicationMethodType.PERCENTAGE) {
    return getPromotionValueForPercentage(promotion, lineItemTotal)
  }

  return getPromotionValueForFixed(promotion, lineItemTotal, lineItemsTotal)
}

export function getApplicableQuantity(lineItem, maxQuantity) {
  if (maxQuantity && lineItem.quantity) {
    return MathBN.min(lineItem.quantity, maxQuantity)
  }

  return lineItem.quantity
}

/**
 * Calculate gross total from subtotal and tax_lines
 * ALL promotions apply to post-tax (gross) amounts
 */
function getLineItemGrossTotal(lineItem) {
  const subtotal = MathBN.convert(lineItem.subtotal)

  // Calculate tax from tax_lines if available
  if (
    lineItem.tax_lines &&
    Array.isArray(lineItem.tax_lines) &&
    lineItem.tax_lines.length > 0
  ) {
    const totalTaxRate = lineItem.tax_lines.reduce(
      (acc, taxLine) => MathBN.add(acc, MathBN.div(taxLine.rate, 100)),
      MathBN.convert(0)
    )
    const taxAmount = MathBN.mult(subtotal, totalTaxRate)
    return MathBN.add(subtotal, taxAmount)
  }

  // If no tax_lines, return subtotal (gross = net when no tax)
  return subtotal
}

function getLineItemUnitPriceGross(lineItem) {
  const grossTotal = getLineItemGrossTotal(lineItem)
  return MathBN.div(grossTotal, lineItem.quantity)
}

export function calculateAdjustmentAmountFromPromotion(
  lineItem,
  promotion,
  lineItemsTotal: BigNumberInput = 0
) {
  /*
    ALL promotions apply to GROSS (post-tax) amounts.
    - PERCENTAGE: Calculate percentage on gross total
    - FIXED: Distribute fixed amount proportionally across items based on gross totals
  */

  if (promotion.allocation === ApplicationMethodAllocation.ACROSS) {
    const quantity = getApplicableQuantity(lineItem, promotion.max_quantity)

    // Always use GROSS for all promotion types
    const lineItemTotal = MathBN.mult(
      getLineItemUnitPriceGross(lineItem),
      quantity
    )
    const applicableTotal = MathBN.sub(lineItemTotal, promotion.applied_value)

    if (MathBN.lte(applicableTotal, 0)) {
      return applicableTotal
    }

    const promotionValue = getPromotionValue(
      promotion,
      applicableTotal,
      lineItemsTotal
    )

    return MathBN.min(promotionValue, applicableTotal)
  }

  /*
    For EACH allocation - also use GROSS
  */
  const grossTotal = getLineItemGrossTotal(lineItem)
  const remainingItemTotal = MathBN.sub(grossTotal, promotion.applied_value)

  const unitPriceGross = MathBN.div(grossTotal, lineItem.quantity)
  const maximumPromotionTotal = MathBN.mult(
    unitPriceGross,
    promotion.max_quantity ?? MathBN.convert(1)
  )
  const applicableTotal = MathBN.min(remainingItemTotal, maximumPromotionTotal)

  if (MathBN.lte(applicableTotal, 0)) {
    return MathBN.convert(0)
  }

  const promotionValue = getPromotionValue(
    promotion,
    applicableTotal,
    lineItemsTotal
  )

  return MathBN.min(promotionValue, applicableTotal)
}
