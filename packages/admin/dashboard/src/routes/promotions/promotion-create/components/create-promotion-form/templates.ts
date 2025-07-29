const commonHiddenFields = [
  "type",
  "application_method.type",
  "application_method.allocation",
]

export const templates = [
  {
    id: "amount_off_products",
    type: "standard",
    title: "Amount off products",
    description: "Discount specific products or collection of products",
    hiddenFields: [...commonHiddenFields],
    defaults: {
      is_automatic: "false",
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
    title: "Amount off order",
    description: "Discounts the total order amount",
    hiddenFields: [...commonHiddenFields],
    defaults: {
      is_automatic: "false",
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
    title: "Percentage off product",
    description: "Discounts a percentage off selected products",
    hiddenFields: [...commonHiddenFields],
    defaults: {
      is_automatic: "false",
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
    title: "Percentage off order",
    description: "Discounts a percentage of the total order amount",
    hiddenFields: [...commonHiddenFields],
    defaults: {
      is_automatic: "false",
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
    title: "Buy X Get Y",
    description: "Buy X product(s), get Y product(s)",
    hiddenFields: [...commonHiddenFields, "application_method.value"],
    defaults: {
      is_automatic: "false",
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
    title: "Spend Threshold Discount",
    description: "Get a discount when order total exceeds a set amount",
    hiddenFields: [...commonHiddenFields],
    defaults: {
      is_automatic: "false",
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
    title: "Buy in price range, get gift product",
    description:
      "Get a gift product when the order total is within a specific price range",
    hiddenFields: [...commonHiddenFields],
    defaults: {
      is_automatic: "false",
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
    title: "Buy X get percentage off",
    description: "Buy X product(s), get a percentage off each product",
    hiddenFields: [...commonHiddenFields, "rules"],
    defaults: {
      is_automatic: "false",
      type: "buyget",
      application_method: {
        type: "percentage",
        apply_to_quantity: 1,
        max_quantity: 1,
      },
    },
  },
]
