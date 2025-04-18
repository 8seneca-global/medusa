import { defineJoinerConfig, Modules } from "@8medusa/framework/utils"
import { Price, PriceList, PricePreference, PriceSet } from "@models"
import { default as schema } from "./schema"

export const joinerConfig = defineJoinerConfig(Modules.PRICING, {
  schema,
  models: [PriceSet, PriceList, Price, PricePreference],
})
