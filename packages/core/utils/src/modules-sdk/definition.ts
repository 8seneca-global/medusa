export const Modules = {
  AUTH: "auth",
  CACHE: "cache",
  CART: "cart",
  CUSTOMER: "customer",
  EVENT_BUS: "event_bus",
  INVENTORY: "inventory",
  LINK: "link_modules",
  PAYMENT: "payment",
  PRICING: "pricing",
  PRODUCT: "product",
  PROMOTION: "promotion",
  SALES_CHANNEL: "sales_channel",
  TAX: "tax",
  FULFILLMENT: "fulfillment",
  STOCK_LOCATION: "stock_location",
  USER: "user",
  WORKFLOW_ENGINE: "workflows",
  REGION: "region",
  ORDER: "order",
  API_KEY: "api_key",
  STORE: "store",
  CURRENCY: "currency",
  FILE: "file",
  NOTIFICATION: "notification",
  INDEX: "index",
  LOCKING: "locking",
} as const

export const MODULE_PACKAGE_NAMES = {
  [Modules.AUTH]: "@8medusa/medusa/auth",
  [Modules.CACHE]: "@8medusa/medusa/cache-inmemory",
  [Modules.CART]: "@8medusa/medusa/cart",
  [Modules.CUSTOMER]: "@8medusa/medusa/customer",
  [Modules.EVENT_BUS]: "@8medusa/medusa/event-bus-local",
  [Modules.INVENTORY]: "@8medusa/medusa/inventory",
  [Modules.LINK]: "@8medusa/medusa/link-modules",
  [Modules.PAYMENT]: "@8medusa/medusa/payment",
  [Modules.PRICING]: "@8medusa/medusa/pricing",
  [Modules.PRODUCT]: "@8medusa/medusa/product",
  [Modules.PROMOTION]: "@8medusa/medusa/promotion",
  [Modules.SALES_CHANNEL]: "@8medusa/medusa/sales-channel",
  [Modules.FULFILLMENT]: "@8medusa/medusa/fulfillment",
  [Modules.STOCK_LOCATION]: "@8medusa/medusa/stock-location",
  [Modules.TAX]: "@8medusa/medusa/tax",
  [Modules.USER]: "@8medusa/medusa/user",
  [Modules.WORKFLOW_ENGINE]: "@8medusa/medusa/workflow-engine-inmemory",
  [Modules.REGION]: "@8medusa/medusa/region",
  [Modules.ORDER]: "@8medusa/medusa/order",
  [Modules.API_KEY]: "@8medusa/medusa/api-key",
  [Modules.STORE]: "@8medusa/medusa/store",
  [Modules.CURRENCY]: "@8medusa/medusa/currency",
  [Modules.FILE]: "@8medusa/medusa/file",
  [Modules.NOTIFICATION]: "@8medusa/medusa/notification",
  [Modules.INDEX]: "@8medusa/medusa/index-module",
  [Modules.LOCKING]: "@8medusa/medusa/locking",
}

export const REVERSED_MODULE_PACKAGE_NAMES = Object.entries(
  MODULE_PACKAGE_NAMES
).reduce((acc, [key, value]) => {
  acc[value] = key
  return acc
}, {})

// TODO: temporary fix until the event bus, cache and workflow engine are migrated to use providers and therefore only a single resolution will be good
export const TEMPORARY_REDIS_MODULE_PACKAGE_NAMES = {
  [Modules.EVENT_BUS]: "@8medusa/medusa/event-bus-redis",
  [Modules.CACHE]: "@8medusa/medusa/cache-redis",
  [Modules.WORKFLOW_ENGINE]: "@8medusa/medusa/workflow-engine-redis",
  [Modules.LOCKING]: "@8medusa/medusa/locking-redis",
}

REVERSED_MODULE_PACKAGE_NAMES[
  TEMPORARY_REDIS_MODULE_PACKAGE_NAMES[Modules.EVENT_BUS]
] = Modules.EVENT_BUS
REVERSED_MODULE_PACKAGE_NAMES[
  TEMPORARY_REDIS_MODULE_PACKAGE_NAMES[Modules.CACHE]
] = Modules.CACHE
REVERSED_MODULE_PACKAGE_NAMES[
  TEMPORARY_REDIS_MODULE_PACKAGE_NAMES[Modules.WORKFLOW_ENGINE]
] = Modules.WORKFLOW_ENGINE
REVERSED_MODULE_PACKAGE_NAMES[
  TEMPORARY_REDIS_MODULE_PACKAGE_NAMES[Modules.LOCKING]
] = Modules.LOCKING

/**
 * Making modules be referenced as a type as well.
 */
export type Modules = (typeof Modules)[keyof typeof Modules]
export const ModuleRegistrationName = Modules
