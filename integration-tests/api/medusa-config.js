const { Modules } = require("@8medusa/utils")

const DB_HOST = process.env.DB_HOST
const DB_USERNAME = process.env.DB_USERNAME
const DB_PASSWORD = process.env.DB_PASSWORD
const DB_NAME = process.env.DB_TEMP_NAME
const DB_URL = `postgres://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}`
process.env.POSTGRES_URL = DB_URL
process.env.LOG_LEVEL = "error"

const enableMedusaV2 = process.env.MEDUSA_FF_MEDUSA_V2 == "true"

const customPaymentProvider = {
  resolve: {
    services: [require("@8medusa/payment/dist/providers/system").default],
  },
  id: "default_2",
}

const customFulfillmentProvider = {
  resolve: "@8medusa/fulfillment-manual",
  id: "test-provider",
}

module.exports = {
  admin: {
    disable: true,
  },
  plugins: [],
  projectConfig: {
    databaseUrl: DB_URL,
    databaseType: "postgres",
    http: {
      jwtSecret: "test",
      cookieSecret: "test",
    },
  },
  featureFlags: {
    medusa_v2: enableMedusaV2,
  },
  modules: {
    [Modules.AUTH]: true,
    [Modules.USER]: {
      scope: "internal",
      resolve: "@8medusa/user",
      options: {
        jwt_secret: "test",
      },
    },
    [Modules.CACHE]: {
      resolve: "@8medusa/cache-inmemory",
      options: { ttl: 0 }, // Cache disabled
    },
    [Modules.STOCK_LOCATION]: {
      resolve: "@8medusa/stock-location",
      options: {},
    },
    [Modules.INVENTORY]: {
      resolve: "@8medusa/inventory",
      options: {},
    },
    [Modules.FILE]: {
      resolve: "@8medusa/file",
      options: {
        providers: [
          {
            resolve: "@8medusa/file-local",
            id: "local",
          },
        ],
      },
    },
    [Modules.PRODUCT]: true,
    [Modules.PRICING]: true,
    [Modules.PROMOTION]: true,
    [Modules.REGION]: true,
    [Modules.CUSTOMER]: true,
    [Modules.SALES_CHANNEL]: true,
    [Modules.CART]: true,
    [Modules.WORKFLOW_ENGINE]: true,
    [Modules.REGION]: true,
    [Modules.API_KEY]: true,
    [Modules.STORE]: true,
    [Modules.TAX]: true,
    [Modules.CURRENCY]: true,
    [Modules.ORDER]: true,
    [Modules.PAYMENT]: {
      resolve: "@8medusa/payment",
      /** @type {import('@8medusa/payment').PaymentModuleOptions}*/
      options: {
        providers: [customPaymentProvider],
      },
    },
    [Modules.FULFILLMENT]: {
      /** @type {import('@8medusa/fulfillment').FulfillmentModuleOptions} */
      options: {
        providers: [customFulfillmentProvider],
      },
    },
    [Modules.NOTIFICATION]: {
      /** @type {import('@8medusa/types').LocalNotificationServiceOptions} */
      options: {
        providers: [
          {
            resolve: "@8medusa/notification-local",
            id: "local-notification-provider",
            options: {
              name: "Local Notification Provider",
              channels: ["log", "email"],
            },
          },
        ],
      },
    },
  },
}
