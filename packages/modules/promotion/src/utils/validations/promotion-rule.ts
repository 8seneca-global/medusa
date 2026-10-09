import {
  ApplicationMethodTargetTypeValues,
  PromotionRuleDTO,
  PromotionRuleOperatorValues,
} from "@8medusa/framework/types"
import {
  ApplicationMethodTargetType,
  MathBN,
  MedusaError,
  PromotionRuleOperator,
  isPresent,
  isString,
  pickValueFromObject,
} from "@8medusa/framework/utils"
import { CreatePromotionRuleDTO } from "@types"

export function validatePromotionRuleAttributes(
  promotionRulesData: CreatePromotionRuleDTO[]
) {
  const errors: string[] = []

  for (const promotionRuleData of promotionRulesData) {
    if (!isPresent(promotionRuleData.attribute)) {
      errors.push("rules[].attribute is a required field")
    }

    if (!isPresent(promotionRuleData.operator)) {
      errors.push("rules[].operator is a required field")
    }

    if (isPresent(promotionRuleData.operator)) {
      const allowedOperators: PromotionRuleOperatorValues[] = Object.values(
        PromotionRuleOperator
      )

      if (!allowedOperators.includes(promotionRuleData.operator)) {
        errors.push(
          `rules[].operator (${
            promotionRuleData.operator
          }) is invalid. It should be one of ${allowedOperators.join(", ")}`
        )
      }
    } else {
      errors.push("rules[].operator is a required field")
    }
  }

  if (!errors.length) return

  throw new MedusaError(MedusaError.Types.INVALID_DATA, errors.join(", "))
}

export function areRulesValidForContext(
  rules: PromotionRuleDTO[],
  context: Record<string, any>,
  contextScope: ApplicationMethodTargetTypeValues
): boolean {
  if (!rules?.length) {
    return true
  }

  const isItemScope = contextScope === ApplicationMethodTargetType.ITEMS
  const isShippingScope =
    contextScope === ApplicationMethodTargetType.SHIPPING_METHODS

  return rules.every((rule) => {
    if (!rule.attribute || !rule.values?.length) {
      return false
    }

    const validRuleValues = rule.values
      .filter((v) => isString(v.value))
      .map((v) => v.value as string)

    if (!validRuleValues.length) {
      return false
    }

    let ruleAttribute = rule.attribute
    if (isItemScope) {
      ruleAttribute = ruleAttribute.replace(
        `${ApplicationMethodTargetType.ITEMS}.`,
        ""
      )
    } else if (isShippingScope) {
      ruleAttribute = ruleAttribute.replace(
        `${ApplicationMethodTargetType.SHIPPING_METHODS}.`,
        ""
      )
    }

    const valuesToCheck = pickValueFromObject(ruleAttribute, context)

    return evaluateRuleValueCondition(
      validRuleValues,
      rule.operator!,
      valuesToCheck
    )
  })
}

/*
  Optimized evaluateRuleValueCondition by using early returns and cleaner approach
  for evaluating rule conditions.
*/
export function evaluateRuleValueCondition(
  ruleValues: string[],
  operator: string,
  ruleValuesToCheck: (string | number)[] | (string | number)
): boolean {
  const valuesToCheck = Array.isArray(ruleValuesToCheck)
    ? ruleValuesToCheck
    : [ruleValuesToCheck]

  // Fork divergence: upstream fails every operator on an empty list, so "customer group not in
  // VOC" rejected a guest customer who belongs to no group. An empty list contains none of the
  // excluded values, so "ne" passes; every other operator still needs a value to match.
  if (!valuesToCheck.length) {
    return operator === "ne"
  }

  switch (operator) {
    // Backport of upstream medusajs/medusa#13078: a context value can be a list
    // (e.g. a product's categories), and "in" must match when any one of them is
    // in the rule values. Requiring all of them to match broke "in".
    // Fork divergence: "eq" had the same flaw, so "category equals C1" failed for a
    // product in C1 and C2; it now matches like "in". A single value, such as a
    // currency, behaves as before.
    case "eq":
    case "in": {
      const ruleValueSet = new Set(ruleValues)
      return valuesToCheck.some((val) => ruleValueSet.has(`${val}`))
    }
    case "ne": {
      const ruleValueSet = new Set(ruleValues)
      return valuesToCheck.every((val) => !ruleValueSet.has(`${val}`))
    }
    case "gt":
      return valuesToCheck.every((val) =>
        ruleValues.some((ruleVal) => MathBN.gt(val, ruleVal))
      )
    case "gte":
      return valuesToCheck.every((val) =>
        ruleValues.some((ruleVal) => MathBN.gte(val, ruleVal))
      )
    case "lt":
      return valuesToCheck.every((val) =>
        ruleValues.some((ruleVal) => MathBN.lt(val, ruleVal))
      )
    case "lte":
      return valuesToCheck.every((val) =>
        ruleValues.some((ruleVal) => MathBN.lte(val, ruleVal))
      )
    default:
      return false
  }
}
