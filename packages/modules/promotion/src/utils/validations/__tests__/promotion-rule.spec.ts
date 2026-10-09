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
