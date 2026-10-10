import { ApplicationMethodTargetType } from "@8medusa/framework/utils"
import { areRulesValidForContext } from "../promotion-rule"

// Promotion-level rules (customer group) are checked in the ORDER scope, as promotion-module does.
const isValid = (rules: any[], context: Record<string, any>) =>
  areRulesValidForContext(rules, context, ApplicationMethodTargetType.ORDER)

const excludedGroups = ["cusgroup_voc", "cusgroup_myriada"]

const rule = (operator: string, values: string[]): any[] => [
  {
    attribute: "customer.groups.id",
    operator,
    values: values.map((value) => ({ value })),
  },
]

const customerIn = (...groups: string[]) => ({
  customer: { groups: groups.map((id) => ({ id })) },
})

describe("areRulesValidForContext — customer group not in", () => {
  const notIn = rule("ne", excludedGroups)

  it("passes a guest customer who belongs to no group", () => {
    expect(isValid(notIn, customerIn())).toBe(true)
  })

  it("passes a cart with no customer yet", () => {
    expect(isValid(notIn, {})).toBe(true)
  })

  it("passes a customer in another group", () => {
    expect(isValid(notIn, customerIn("cusgroup_loyalty"))).toBe(true)
  })

  it("rejects a customer in an excluded group, alone or alongside others", () => {
    expect(isValid(notIn, customerIn("cusgroup_voc"))).toBe(false)
    expect(
      isValid(notIn, customerIn("cusgroup_loyalty", "cusgroup_myriada"))
    ).toBe(false)
  })

  it("still rejects an empty group list for the other operators", () => {
    for (const operator of ["in", "eq"]) {
      expect(isValid(rule(operator, excludedGroups), customerIn())).toBe(false)
    }
  })
})

describe("areRulesValidForContext — equals on a multi-valued field", () => {
  const equalsA = rule("eq", ["cusgroup_a"])

  it("passes a customer who is in the group alongside others", () => {
    expect(isValid(equalsA, customerIn("cusgroup_a", "cusgroup_b"))).toBe(true)
  })

  it("rejects a customer who is not in the group", () => {
    expect(isValid(equalsA, customerIn("cusgroup_b"))).toBe(false)
    expect(isValid(equalsA, customerIn())).toBe(false)
  })

  it("passes a product in the category alongside others", () => {
    const categoryEquals = [
      {
        attribute: "items.product.categories.id",
        operator: "eq",
        values: [{ value: "pcat_c1" }],
      },
    ] as any[]
    const item = {
      product: { categories: [{ id: "pcat_c1" }, { id: "pcat_c2" }] },
    }

    expect(
      areRulesValidForContext(
        categoryEquals,
        item,
        ApplicationMethodTargetType.ITEMS
      )
    ).toBe(true)
  })

  it("keeps single-valued fields as they were", () => {
    const currencyEquals = [
      {
        attribute: "currency_code",
        operator: "eq",
        values: [{ value: "eur" }],
      },
    ] as any[]

    expect(isValid(currencyEquals, { currency_code: "eur" })).toBe(true)
    expect(isValid(currencyEquals, { currency_code: "czk" })).toBe(false)
  })
})
