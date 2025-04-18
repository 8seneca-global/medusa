import { FulfillmentModuleService } from "@services"
import loadProviders from "./loaders/providers"
import { Module, Modules } from "@8medusa/framework/utils"

export default Module(Modules.FULFILLMENT, {
  service: FulfillmentModuleService,
  loaders: [loadProviders],
})

// Module options types
export { FulfillmentModuleOptions } from "./types"
