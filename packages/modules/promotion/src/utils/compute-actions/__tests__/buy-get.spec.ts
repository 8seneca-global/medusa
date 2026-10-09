import {
  ApplicationMethodAllocation,
  ApplicationMethodTargetType,
  ApplicationMethodType,
  PromotionType,
} from "@8medusa/framework/utils"
import { getComputedActionsForBuyGet } from "../buy-get"

const category = "pcat_chocolate"
const inCategory = [
  {
    attribute: "product.categories.id",
    operator: "in",
    values: [{ value: category }],
  },
]

const buyGet = (buyQuantity: number): any => ({
  id: "promo_test",
  code: "BUYGET",
  type: PromotionType.BUYGET,
  application_method: {
    type: ApplicationMethodType.PERCENTAGE,
    target_type: ApplicationMethodTargetType.ITEMS,
    allocation: ApplicationMethodAllocation.EACH,
    value: 100,
    max_quantity: 1,
    apply_to_quantity: 1,
    buy_rules_min_quantity: buyQuantity,
    buy_rules: inCategory,
    target_rules: inCategory,
  },
})

const line = (id: string, quantity: number, unitPrice: number): any => ({
  id,
  quantity,
  subtotal: quantity * unitPrice,
  product: { categories: [{ id: category }] },
})

const compute = (buyQuantity: number, items: any[]) =>
  getComputedActionsForBuyGet(
    buyGet(buyQuantity),
    items,
    new Map(),
    new Map(),
    new Map()
  ).map((action: any) => ({
    item_id: action.item_id,
    amount: Number(action.amount),
  }))

describe("getComputedActionsForBuyGet — which unit is free", () => {
  it("gives away the cheapest unit, not the most expensive one", () => {
    expect(
      compute(5, [line("item_cheap", 5, 4.99), line("item_expensive", 5, 6.66)])
    ).toEqual([{ item_id: "item_cheap", amount: 4.99 }])
  })

  it("frees a cheap unit when the bought units leave an expensive one over", () => {
    // Buy 2 get 1 with 3 + 3 units: the old most-valuable-first order made the
    // third expensive unit free.
    expect(
      compute(2, [line("item_cheap", 3, 4.99), line("item_expensive", 3, 6.66)])
    ).toEqual([{ item_id: "item_cheap", amount: 4.99 }])
  })

  it("compares unit prices, not line totals", () => {
    // The cheap line's total (10) beats the dearer line's (6), so ordering by
    // line total would pick the wrong unit.
    expect(
      compute(2, [line("item_cheap", 10, 1), line("item_dearer", 2, 3)])
    ).toEqual([{ item_id: "item_cheap", amount: 1 }])
  })
})
