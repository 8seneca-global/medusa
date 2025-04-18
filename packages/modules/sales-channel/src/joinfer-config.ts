import { defineJoinerConfig, Modules } from "@8medusa/framework/utils"
import { default as schema } from "./schema"

export const joinerConfig = defineJoinerConfig(Modules.SALES_CHANNEL, {
  schema,
})
