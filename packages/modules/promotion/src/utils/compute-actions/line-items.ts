import {
  ApplicationMethodAllocationValues,
  BigNumberInput,
  PromotionTypes,
} from "@8medusa/framework/types"
import {
  ApplicationMethodAllocation,
  ApplicationMethodTargetType,
  ComputedActions,
  MathBN,
  MedusaError,
  ApplicationMethodTargetType as TargetType,
  calculateAdjustmentAmountFromPromotion,
} from "@8medusa/framework/utils"
import { areRulesValidForContext } from "../validations"
import { computeActionForBudgetExceeded } from "./usage"

function validateContext(
  contextKey: string,
  context: PromotionTypes.ComputeActionContext[TargetType]
) {
  if (!context) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `"${contextKey}" should be present as an array in the context for computeActions`
    )
  }
}

export function getComputedActionsForItems(
  promotion: PromotionTypes.PromotionDTO,
  items: PromotionTypes.ComputeActionContext[TargetType.ITEMS],
  appliedPromotionsMap: Map<string, number>,
  allocationOverride?: ApplicationMethodAllocationValues
): PromotionTypes.ComputeActions[] {
  validateContext("items", items)

  return applyPromotionToItems(
    promotion,
    items,
    appliedPromotionsMap,
    allocationOverride
  )
}

export function getComputedActionsForShippingMethods(
  promotion: PromotionTypes.PromotionDTO,
  shippingMethods: PromotionTypes.ComputeActionContext[TargetType.SHIPPING_METHODS],
  appliedPromotionsMap: Map<string, number>
): PromotionTypes.ComputeActions[] {
  validateContext("shipping_methods", shippingMethods)

  return applyPromotionToItems(promotion, shippingMethods, appliedPromotionsMap)
}

export function getComputedActionsForOrder(
  promotion: PromotionTypes.PromotionDTO,
  itemApplicationContext: PromotionTypes.ComputeActionContext,
  methodIdPromoValueMap: Map<string, number>
): PromotionTypes.ComputeActions[] {
  return getComputedActionsForItems(
    promotion,
    itemApplicationContext[TargetType.ITEMS],
    methodIdPromoValueMap,
    ApplicationMethodAllocation.ACROSS
  )
}

function applyPromotionToItems(
  promotion: PromotionTypes.PromotionDTO,
  items:
    | PromotionTypes.ComputeActionContext[TargetType.ITEMS]
    | PromotionTypes.ComputeActionContext[TargetType.SHIPPING_METHODS],
  appliedPromotionsMap: Map<string, BigNumberInput>,
  allocationOverride?: ApplicationMethodAllocationValues
): PromotionTypes.ComputeActions[] {
  const { application_method: applicationMethod } = promotion

  if (!applicationMethod) {
    return []
  }

  const allocation = applicationMethod?.allocation! || allocationOverride
  const target = applicationMethod?.target_type

  if (!items?.length || !target) {
    return []
  }

  const computedActions: PromotionTypes.ComputeActions[] = []

  const applicableItems = getValidItemsForPromotion(items, promotion)

  if (!applicableItems.length) {
    return computedActions
  }

  const isTargetShippingMethod = target === TargetType.SHIPPING_METHODS
  const isTargetLineItems = target === TargetType.ITEMS
  const isTargetOrder = target === TargetType.ORDER
  const promotionValue = applicationMethod?.value ?? 0
  const maxQuantity = isTargetShippingMethod
    ? 1
    : applicationMethod?.max_quantity!

  const isTaxInclusive = promotion.is_tax_inclusive ?? false

  let lineItemsTotal = MathBN.convert(0)
  if (allocation === ApplicationMethodAllocation.ACROSS) {
    if (isTaxInclusive) {
      // Tax-inclusive: use GROSS totals (subtotal + tax) — existing Lyra logic
      lineItemsTotal = applicableItems.reduce((acc, item) => {
        let itemTotal = MathBN.convert(item.subtotal)

        if (
          item.tax_lines &&
          Array.isArray(item.tax_lines) &&
          item.tax_lines.length > 0
        ) {
          const taxLines = item.tax_lines as { rate: BigNumberInput }[]
          const totalTaxRate = taxLines.reduce(
            (taxAcc, taxLine) =>
              MathBN.add(taxAcc, MathBN.div(taxLine.rate, 100)),
            MathBN.convert(0)
          )
          const taxAmount = MathBN.mult(item.subtotal, totalTaxRate)
          itemTotal = MathBN.add(item.subtotal, taxAmount)
        }

        return MathBN.sub(
          MathBN.add(acc, itemTotal),
          appliedPromotionsMap.get(item.id) ?? 0
        )
      }, MathBN.convert(0))
    } else {
      // Non-tax-inclusive: use subtotal only — standard upstream logic
      lineItemsTotal = applicableItems.reduce((acc, item) => {
        return MathBN.sub(
          MathBN.add(acc, item.subtotal),
          appliedPromotionsMap.get(item.id) ?? 0
        )
      }, MathBN.convert(0))
    }

    if (MathBN.lte(lineItemsTotal, 0)) {
      return computedActions
    }
  }

  for (const item of applicableItems) {
    if (MathBN.lte(item.subtotal, 0)) {
      continue
    }

    if (isTargetShippingMethod) {
      item.quantity = 1
    }

    const appliedPromoValue = appliedPromotionsMap.get(item.id) ?? 0

    const amount = calculateAdjustmentAmountFromPromotion(
      item,
      {
        value: promotionValue,
        applied_value: appliedPromoValue,
        max_quantity: maxQuantity,
        type: applicationMethod?.type!,
        allocation,
      },
      lineItemsTotal
    )

    if (MathBN.lte(amount, 0)) {
      continue
    }

    const budgetExceededAction = computeActionForBudgetExceeded(
      promotion,
      amount
    )

    if (budgetExceededAction) {
      computedActions.push(budgetExceededAction)
      continue
    }

    appliedPromotionsMap.set(item.id, MathBN.add(appliedPromoValue, amount))

    if (isTargetLineItems || isTargetOrder) {
      computedActions.push({
        action: ComputedActions.ADD_ITEM_ADJUSTMENT,
        item_id: item.id,
        amount,
        code: promotion.code!,
        is_tax_inclusive: isTaxInclusive,
      })
    } else if (isTargetShippingMethod) {
      computedActions.push({
        action: ComputedActions.ADD_SHIPPING_METHOD_ADJUSTMENT,
        shipping_method_id: item.id,
        amount,
        code: promotion.code!,
        is_tax_inclusive: isTaxInclusive,
      })
    }
  }

  return computedActions
}

function getValidItemsForPromotion(
  items:
    | PromotionTypes.ComputeActionContext[TargetType.ITEMS]
    | PromotionTypes.ComputeActionContext[TargetType.SHIPPING_METHODS],
  promotion: PromotionTypes.PromotionDTO
) {
  if (!items?.length || !promotion?.application_method) {
    return []
  }

  const isTargetShippingMethod =
    promotion.application_method?.target_type === TargetType.SHIPPING_METHODS

  const targetRules = promotion.application_method?.target_rules ?? []
  const hasTargetRules = targetRules.length > 0

  if (isTargetShippingMethod && !hasTargetRules) {
    return items.filter(
      (item) => item && "subtotal" in item && MathBN.gt(item.subtotal, 0)
    )
  }

  return items.filter((item) => {
    if (!item || !("subtotal" in item) || MathBN.lte(item.subtotal, 0)) {
      return false
    }

    if (!isTargetShippingMethod && !("quantity" in item)) {
      return false
    }

    if (!hasTargetRules) {
      return true
    }

    return areRulesValidForContext(
      promotion?.application_method?.target_rules!,
      item,
      ApplicationMethodTargetType.ITEMS
    )
  })
}
