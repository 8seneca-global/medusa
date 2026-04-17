const commonHiddenFields = [
  "type",
  "application_method.type",
  "application_method.allocation",
]

const amountOfProductHiddenFields = [...commonHiddenFields]

const amountOfOrderHiddenFields = [...commonHiddenFields]

const percentageOfProductHiddenFields = [
  ...commonHiddenFields,
  "is_tax_inclusive",
]

const percentageOfOrderHiddenFields = [
  ...commonHiddenFields,
  "is_tax_inclusive",
]

const buyGetHiddenFields = [
  ...commonHiddenFields,
  "application_method.value",
  "is_tax_inclusive",
]

const spendThresholdDiscountHiddenFields = [
  ...commonHiddenFields,
  "is_tax_inclusive",
]

const priceRangeGiftHiddenFields = [
  ...commonHiddenFields,
  "is_tax_inclusive",
]

const buyXGetPercentageOffHiddenFields = [
  ...commonHiddenFields,
  "rules",
  "is_tax_inclusive",
]

export const templates = [
  {
    id: "amount_off_products",
    type: "standard",
    title: "promotions.templates.amount_off_products.title",
    description: "promotions.templates.amount_off_products.description",
    hiddenFields: amountOfProductHiddenFields,
    defaults: {
      is_automatic: "false",
      is_tax_inclusive: false,
      type: "standard",
      application_method: {
        allocation: "each",
        target_type: "items",
        type: "fixed",
      },
    },
  },
  {
    id: "amount_off_order",
    type: "standard",
    title: "promotions.templates.amount_off_order.title",
    description: "promotions.templates.amount_off_order.description",
    hiddenFields: amountOfOrderHiddenFields,
    defaults: {
      is_automatic: "false",
      is_tax_inclusive: false,
      type: "standard",
      application_method: {
        allocation: "across",
        target_type: "order",
        type: "fixed",
      },
    },
  },
  {
    id: "percentage_off_product",
    type: "standard",
    title: "promotions.templates.percentage_off_product.title",
    description: "promotions.templates.percentage_off_product.description",
    hiddenFields: percentageOfProductHiddenFields,
    defaults: {
      is_automatic: "false",
      is_tax_inclusive: false,
      type: "standard",
      application_method: {
        allocation: "each",
        target_type: "items",
        type: "percentage",
      },
    },
  },
  {
    id: "percentage_off_order",
    type: "standard",
    title: "promotions.templates.percentage_off_order.title",
    description: "promotions.templates.percentage_off_order.description",
    hiddenFields: percentageOfOrderHiddenFields,
    defaults: {
      is_automatic: "false",
      is_tax_inclusive: false,
      type: "standard",
      application_method: {
        allocation: "across",
        target_type: "order",
        type: "percentage",
      },
    },
  },
  {
    id: "buy_get",
    type: "buy_get",
    title: "promotions.templates.buy_get.title",
    description: "promotions.templates.buy_get.description",
    hiddenFields: buyGetHiddenFields,
    defaults: {
      is_automatic: "false",
      is_tax_inclusive: false,
      type: "buyget",
      application_method: {
        type: "percentage",
        value: 100,
        apply_to_quantity: 1,
        max_quantity: 1,
      },
    },
  },
  {
    id: "spend_threshold_discount",
    type: "standard",
    title: "promotions.templates.spend_threshold_discount.title",
    description: "promotions.templates.spend_threshold_discount.description",
    hiddenFields: spendThresholdDiscountHiddenFields,
    defaults: {
      is_automatic: "false",
      is_tax_inclusive: false,
      type: "standard",
      application_method: {
        allocation: "across",
        target_type: "order",
        type: "percentage",
      },
    },
  },
  {
    id: "price_range_gift",
    type: "standard",
    title: "promotions.templates.price_range_gift.title",
    description: "promotions.templates.price_range_gift.description",
    hiddenFields: priceRangeGiftHiddenFields,
    defaults: {
      is_automatic: "false",
      is_tax_inclusive: false,
      type: "standard",
      application_method: {
        allocation: "across",
        target_type: "order",
        type: "fixed",
      },
    },
  },
  {
    id: "buy_x_get_percentage_off",
    type: "standard",
    title: "promotions.templates.buy_x_get_percentage_off.title",
    description: "promotions.templates.buy_x_get_percentage_off.description",
    hiddenFields: buyXGetPercentageOffHiddenFields,
    defaults: {
      is_automatic: "false",
      is_tax_inclusive: false,
      type: "buyget",
      application_method: {
        type: "percentage",
        apply_to_quantity: 1,
        max_quantity: 1,
      },
    },
  },
]
