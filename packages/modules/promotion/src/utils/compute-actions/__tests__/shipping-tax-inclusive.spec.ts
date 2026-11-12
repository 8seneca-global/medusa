import {
  ApplicationMethodAllocation,
  ApplicationMethodTargetType,
  ApplicationMethodType,
} from "@8medusa/framework/utils"
// Workspace @8medusa/utils, as in line-items.spec.ts: the totals production ships.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { decorateCartTotals } = require("@8medusa/utils")
import { getComputedActionsForShippingMethods } from "../line-items"

// A Slovak shipping fee: €10 net + 20 % VAT = €12 to the customer.
const courier = () => ({
  id: "sm_courier",
  subtotal: 10,
  tax_lines: [{ rate: 20 }],
})

const shippingPromotion = (
  type: string,
  value: number,
  isTaxInclusive: boolean
): any => ({
  id: "promo_ship",
  code: "SHIP",
  is_tax_inclusive: isTaxInclusive,
  application_method: {
    type,
    value,
    target_type: ApplicationMethodTargetType.SHIPPING_METHODS,
    allocation: ApplicationMethodAllocation.ACROSS,
    currency_code: "eur",
  },
})

/** What the customer pays for shipping once the promotion's adjustment is in the cart totals. */
const shippingPaid = (promotion: any) => {
  const [action]: any[] = getComputedActionsForShippingMethods(
    promotion,
    [courier()] as any,
    new Map()
  )
  const cart: any = decorateCartTotals({
    items: [],
    shipping_methods: [
      {
        id: "sm_courier",
        amount: 10,
        is_tax_inclusive: false,
        tax_lines: [{ rate: 20 }],
        adjustments: action ? [{ amount: action.amount }] : [],
      },
    ],
  })
  return Number(cart.shipping_methods[0].total)
}

describe("shipping promotions, €12 (€10 + 20 % VAT) fee", () => {
  it.each([
    ["free shipping", ApplicationMethodType.PERCENTAGE, 100, 0],
    ["50 % off", ApplicationMethodType.PERCENTAGE, 50, 6],
    ["€5 off", ApplicationMethodType.FIXED, 5, 7],
  ])(
    "tax-inclusive %s: customer pays the fee minus the promotion value",
    (_, type, value, paid) => {
      expect(shippingPaid(shippingPromotion(type, value, true))).toBe(paid)
    }
  )

  it.each([
    ["free shipping", ApplicationMethodType.PERCENTAGE, 100, 0],
    ["50 % off", ApplicationMethodType.PERCENTAGE, 50, 6],
    // Tax-exclusive keeps upstream: €5 is net, €6 gross.
    ["€5 off (net)", ApplicationMethodType.FIXED, 5, 6],
  ])("tax-exclusive %s keeps the upstream amounts", (_, type, value, paid) => {
    expect(shippingPaid(shippingPromotion(type, value, false))).toBe(paid)
  })

  it("never takes more than the fee", () => {
    expect(
      shippingPaid(shippingPromotion(ApplicationMethodType.FIXED, 50, true))
    ).toBe(0)
  })
})
