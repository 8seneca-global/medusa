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

const lineWithVat = (
  id: string,
  quantity: number,
  netUnitPrice: number,
  vatRate: number
): any => ({
  ...line(id, quantity, netUnitPrice),
  subtotal: Math.round(quantity * netUnitPrice * 100) / 100,
  tax_lines: [{ rate: vatRate }],
})

describe("getComputedActionsForBuyGet — free unit including VAT", () => {
  it("discounts the free unit by its gross price, rounded to the cent", () => {
    // 3 x 4.06 net at 23% is 14.98 gross; the free unit must take 4.99 off, not the net 4.06
    expect(compute(2, [lineWithVat("item", 3, 4.06, 23)])).toEqual([
      { item_id: "item", amount: 4.99 },
    ])
  })

  it("makes a single-unit line fully free", () => {
    // 1.68 net at 23% is 2.07 gross (1.68 + 0.39)
    expect(
      compute(2, [
        lineWithVat("item_dear", 2, 6.66, 23),
        lineWithVat("item_cheap", 1, 1.68, 23),
      ])
    ).toEqual([{ item_id: "item_cheap", amount: 2.07 }])
  })

  it("picks the cheapest unit by gross price when VAT rates differ", () => {
    // 4.40 net at 5% (4.62 gross) is cheaper than 4.00 net at 23% (4.92 gross)
    expect(
      compute(1, [
        lineWithVat("item_low_net", 1, 4.0, 23),
        lineWithVat("item_low_gross", 1, 4.4, 5),
      ])
    ).toEqual([{ item_id: "item_low_gross", amount: 4.62 }])
  })
})
