import {
  ApplicationMethodAllocationValues,
  BigNumberInput,
  PromotionTypes,
} from "@8medusa/framework/types"
import {
  ApplicationMethodAllocation,
  ApplicationMethodTargetType,
  ApplicationMethodType,
  ComputedActions,
  MathBN,
  MedusaError,
  ApplicationMethodTargetType as TargetType,
} from "@8medusa/framework/utils"
// Import directly from workspace @8medusa/utils. The framework package in
// node_modules pins an older @8medusa/utils that predates the is_tax_inclusive
// gross-vs-subtotal branching, so re-exporting it via @8medusa/framework/utils
// would route to the stale implementation. Same pattern used by
// __tests__/line-items.spec.ts for decorateCartTotals.
import { calculateAdjustmentAmountFromPromotion } from "@8medusa/utils"
import { BigNumber as BigNumberJS } from "bignumber.js"
import { areRulesValidForContext } from "../validations"
import { computeActionForBudgetExceeded } from "./usage"

// Currency precision is hardcoded to 2 decimal places throughout this
// codebase (see tax, line-item totals). LRM rounding honors the same.
const ROUND_DP = 2
const CENT = 0.01

// MathBN on the version of @8medusa/utils transitively pinned by the
// installed @8medusa/framework package predates the `round`/`floor`
// helpers, so we use bignumber.js directly for 2dp rounding here.
function floorTo(value: BigNumberInput, dp: number): InstanceType<typeof BigNumberJS> {
  return new BigNumberJS(MathBN.convert(value).toString()).decimalPlaces(
    dp,
    BigNumberJS.ROUND_DOWN
  )
}

function roundTo(value: BigNumberInput, dp: number): InstanceType<typeof BigNumberJS> {
  return new BigNumberJS(MathBN.convert(value).toString()).decimalPlaces(
    dp,
    BigNumberJS.ROUND_HALF_UP
  )
}

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

/**
 * Largest-remainder method: round each adjustment amount down to 2dp, then
 * distribute the residual cents to the lines with the largest fractional
 * remainders. Ensures sum(rounded amounts) == target to the cent — so the
 * face value of a fixed/across promotion is delivered exactly even when the
 * pro-rata split has sub-cent residuals.
 */
function applyLargestRemainderRounding(
  adjustmentActions: PromotionTypes.ComputeActions[],
  promotionValue: BigNumberInput,
  appliedPromotionsMap: Map<string, BigNumberInput>
): void {
  // Only operate on item/shipping-method adjustment actions. Budget-exceeded
  // actions carry no amount to redistribute.
  const rows = adjustmentActions
    .map((action, index) => ({ action, index }))
    .filter(
      ({ action }) =>
        action.action === ComputedActions.ADD_ITEM_ADJUSTMENT ||
        action.action === ComputedActions.ADD_SHIPPING_METHOD_ADJUSTMENT
    )

  if (rows.length === 0) {
    return
  }

  const rawSum = rows.reduce(
    (acc, { action }) => MathBN.add(acc, (action as any).amount),
    MathBN.convert(0)
  )

  // Target caps at the promotion value. If capping reduced total allocation
  // (one item hit its applicableTotal ceiling), we align to the raw sum
  // instead of the promotion value — otherwise LRM would invent cents.
  const targetRounded = roundTo(
    MathBN.min(rawSum, promotionValue),
    ROUND_DP
  )

  const floored = rows.map(({ action, index }) => {
    const raw = MathBN.convert((action as any).amount)
    const flooredValue = floorTo(raw, ROUND_DP)
    return {
      index,
      amount: (action as any).amount,
      floored: flooredValue,
      remainder: MathBN.sub(raw, flooredValue),
    }
  })

  const flooredSum = floored.reduce(
    (acc, r) => MathBN.add(acc, r.floored),
    MathBN.convert(0)
  )

  // residualCents is how many cents we still need to distribute so the
  // rounded allocation matches the target. Positive → hand cents out in
  // descending-remainder order. Zero → already exact.
  const residualCents = Math.round(
    Number(MathBN.sub(targetRounded, flooredSum).toFixed(ROUND_DP)) / CENT
  )

  const finalAmounts = new Map<number, BigNumberInput>()
  for (const r of floored) {
    finalAmounts.set(r.index, r.floored)
  }

  if (residualCents > 0) {
    const sorted = [...floored].sort((a, b) => {
      const cmp = MathBN.sub(b.remainder, a.remainder)
      if (!MathBN.eq(cmp, 0)) {
        return MathBN.gt(cmp, 0) ? 1 : -1
      }
      // Deterministic tiebreak by action index so identical remainders always
      // favor the same line across runs.
      return a.index - b.index
    })

    for (let i = 0; i < residualCents && i < sorted.length; i++) {
      const target = sorted[i]
      finalAmounts.set(target.index, MathBN.add(target.floored, CENT))
    }
  }

  for (const { action, index } of rows) {
    const rounded = finalAmounts.get(index)
    if (rounded === undefined) {
      continue
    }
    const previousAmount = (action as any).amount
    ;(action as any).amount = rounded

    // Keep appliedPromotionsMap in sync so subsequent stacked promotions
    // see the LRM-adjusted applied value when they compute their own
    // applicableTotal for this line.
    const key =
      (action as any).item_id ?? (action as any).shipping_method_id
    if (key != null) {
      const prevApplied = appliedPromotionsMap.get(key) ?? 0
      const delta = MathBN.sub(rounded, previousAmount)
      appliedPromotionsMap.set(key, MathBN.add(prevApplied, delta))
    }
  }
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
        is_tax_inclusive: isTaxInclusive,
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

  const isFixed = applicationMethod?.type === ApplicationMethodType.FIXED
  const isAcross = allocation === ApplicationMethodAllocation.ACROSS
  if (isFixed && isAcross) {
    applyLargestRemainderRounding(
      computedActions,
      promotionValue,
      appliedPromotionsMap
    )
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
