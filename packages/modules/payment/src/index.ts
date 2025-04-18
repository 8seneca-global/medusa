import { PaymentModuleService } from "@services"
import loadProviders from "./loaders/providers"
import { Module, Modules } from "@8medusa/framework/utils"

export default Module(Modules.PAYMENT, {
  service: PaymentModuleService,
  loaders: [loadProviders],
})

export { PaymentModuleOptions } from "./types"
