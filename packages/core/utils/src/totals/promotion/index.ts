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
 * Calculate gross total from subtotal and tax_lines.
 * Used when is_tax_inclusive is true — promotions apply to post-tax amounts.
 */
function getLineItemGrossTotal(lineItem) {
  const subtotal = MathBN.convert(lineItem.subtotal)

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

  return subtotal
}

function getLineItemUnitPriceGross(lineItem) {
  const grossTotal = getLineItemGrossTotal(lineItem)
  return MathBN.div(grossTotal, lineItem.quantity)
}

/**
 * Get subtotal (standard upstream logic).
 * Used when is_tax_inclusive is false.
 */
function getLineItemSubtotal(lineItem) {
  return MathBN.convert(lineItem.subtotal)
}

function getLineItemUnitPriceSubtotal(lineItem) {
  return MathBN.div(getLineItemSubtotal(lineItem), lineItem.quantity)
}

export function calculateAdjustmentAmountFromPromotion(
  lineItem,
  promotion,
  lineItemsTotal: BigNumberInput = 0
) {
  const isTaxInclusive = promotion.is_tax_inclusive ?? false

  if (promotion.allocation === ApplicationMethodAllocation.ACROSS) {
    const quantity = getApplicableQuantity(lineItem, promotion.max_quantity)

    // Choose unit price based on tax-inclusive flag
    const unitPrice = isTaxInclusive
      ? getLineItemUnitPriceGross(lineItem)
      : getLineItemUnitPriceSubtotal(lineItem)

    const lineItemTotal = MathBN.mult(unitPrice, quantity)
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

  // EACH allocation — choose total based on tax-inclusive flag
  const itemTotal = isTaxInclusive
    ? getLineItemGrossTotal(lineItem)
    : getLineItemSubtotal(lineItem)

  const remainingItemTotal = MathBN.sub(itemTotal, promotion.applied_value)

  const unitPrice = isTaxInclusive
    ? MathBN.div(getLineItemGrossTotal(lineItem), lineItem.quantity)
    : MathBN.div(getLineItemSubtotal(lineItem), lineItem.quantity)

  const maximumPromotionTotal = MathBN.mult(
    unitPrice,
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
