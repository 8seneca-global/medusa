import { ModuleJoinerConfig } from "@8medusa/framework/types"
import { Modules } from "@8medusa/framework/utils"

export const StoreCurrencies: ModuleJoinerConfig = {
  isLink: true,
  isReadOnlyLink: true,
  extends: [
    {
      serviceName: Modules.STORE,
      entity: "Store",
      relationship: {
        serviceName: Modules.CURRENCY,
        entity: "Currency",
        primaryKey: "code",
        foreignKey: "supported_currencies.currency_code",
        alias: "currency",
        args: {
          methodSuffix: "Currencies",
        },
      },
    },
  ],
}
