import {
  ApplicationMethodAllocation,
  ApplicationMethodTargetType,
  ApplicationMethodType,
} from "@8medusa/framework/utils"
// decorateCartTotals is imported from @8medusa/utils (workspace source)
// directly rather than @8medusa/framework/utils, because the framework
// package in node_modules pins an older @8medusa/utils that predates the
// custom Lyra gross-based totals logic. The end-to-end check below must
// run against the workspace version that production actually ships.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { decorateCartTotals } = require("@8medusa/utils")
import { getComputedActionsForItems } from "../line-items"

describe("getComputedActionsForItems — fixed/across allocation", () => {
  it("distributes rounding residual so adjustment amounts sum exactly to the promotion value", () => {
    // Reproduces cart_01KPW2MJ65SYQ6V7QYSE8X3WTB:
    // three items, subtotals 16.65 + 16.65 + 13.80 = 47.10,
    // fixed €15 promo across. Raw pro-rata shares round individually
    // to 5.30 + 5.30 + 4.39 = 14.99 — a cent short.
    // Largest-remainder distribution must bump the third item to 4.40.
    const promotion: any = {
      id: "promo_test",
      code: "PROMOFF",
      is_tax_inclusive: false,
      application_method: {
        type: ApplicationMethodType.FIXED,
        target_type: ApplicationMethodTargetType.ITEMS,
        allocation: ApplicationMethodAllocation.ACROSS,
        value: 15,
        currency_code: "eur",
      },
    }

    const items: any[] = [
      { id: "item_strawberry", quantity: 5, subtotal: 16.65 },
      { id: "item_raspberry", quantity: 5, subtotal: 16.65 },
      { id: "item_ruby", quantity: 5, subtotal: 13.8 },
    ]

    const actions = getComputedActionsForItems(
      promotion,
      items,
      new Map<string, number>()
    )

    const byItem = Object.fromEntries(
      actions
        .filter((a: any) => a.action === "addItemAdjustment")
        .map((a: any) => [a.item_id, Number(a.amount)])
    )

    expect(byItem.item_strawberry).toBeCloseTo(5.3, 10)
    expect(byItem.item_raspberry).toBeCloseTo(5.3, 10)
    expect(byItem.item_ruby).toBeCloseTo(4.4, 10)

    const sum =
      byItem.item_strawberry + byItem.item_raspberry + byItem.item_ruby
    expect(Number(sum.toFixed(2))).toBe(15)
  })

  it("leaves clean splits unchanged (no residual to redistribute)", () => {
    // subtotals 200 + 600 = 800, fixed 400 across → clean 100/300 split.
    const promotion: any = {
      id: "promo_clean",
      code: "CLEAN",
      is_tax_inclusive: false,
      application_method: {
        type: ApplicationMethodType.FIXED,
        target_type: ApplicationMethodTargetType.ITEMS,
        allocation: ApplicationMethodAllocation.ACROSS,
        value: 400,
        currency_code: "usd",
      },
    }

    const items: any[] = [
      { id: "item_a", quantity: 2, subtotal: 200 },
      { id: "item_b", quantity: 2, subtotal: 600 },
    ]

    const actions = getComputedActionsForItems(
      promotion,
      items,
      new Map<string, number>()
    )

    const byItem = Object.fromEntries(
      actions
        .filter((a: any) => a.action === "addItemAdjustment")
        .map((a: any) => [a.item_id, Number(a.amount)])
    )

    expect(byItem.item_a).toBe(100)
    expect(byItem.item_b).toBe(300)
  })

  it("produces cart totals where original_total - discount_total equals total", () => {
    // End-to-end: feed the Lyra cart through LRM, then through the cart
    // totals pipeline. After LRM the cart-level arithmetic must balance:
    // original_total - discount_total == total. (Before LRM, discount_total
    // was 15 but original - total rounded to 14.99 — the bug we fixed.)
    const promotion: any = {
      id: "promo_test",
      code: "PROMOFF",
      is_tax_inclusive: false,
      application_method: {
        type: ApplicationMethodType.FIXED,
        target_type: ApplicationMethodTargetType.ITEMS,
        allocation: ApplicationMethodAllocation.ACROSS,
        value: 15,
        currency_code: "eur",
      },
    }

    const items: any[] = [
      { id: "item_strawberry", quantity: 5, subtotal: 16.65 },
      { id: "item_raspberry", quantity: 5, subtotal: 16.65 },
      { id: "item_ruby", quantity: 5, subtotal: 13.8 },
    ]

    const actions = getComputedActionsForItems(
      promotion,
      items,
      new Map<string, number>()
    )

    const amountByItem = new Map<string, number>(
      actions
        .filter((a: any) => a.action === "addItemAdjustment")
        .map((a: any) => [a.item_id as string, Number(a.amount)])
    )

    const cartInput: any = {
      items: [
        {
          id: "item_strawberry",
          unit_price: 3.33,
          quantity: 5,
          tax_lines: [{ rate: 23 }],
          adjustments: [{ amount: amountByItem.get("item_strawberry")! }],
        },
        {
          id: "item_raspberry",
          unit_price: 3.33,
          quantity: 5,
          tax_lines: [{ rate: 23 }],
          adjustments: [{ amount: amountByItem.get("item_raspberry")! }],
        },
        {
          id: "item_ruby",
          unit_price: 2.76,
          quantity: 5,
          tax_lines: [{ rate: 23 }],
          adjustments: [{ amount: amountByItem.get("item_ruby")! }],
        },
      ],
    }

    const decorated: any = JSON.parse(
      JSON.stringify(decorateCartTotals(cartInput))
    )

    // Consistency across the three reported figures.
    expect(decorated.discount_total).toBe(15)
    expect(
      Number((decorated.original_total - decorated.total).toFixed(2))
    ).toBe(15)
  })
})
