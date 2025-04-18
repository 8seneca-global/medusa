import { Module, Modules } from "@8medusa/framework/utils"
import { SalesChannelModuleService } from "@services"

export default Module(Modules.SALES_CHANNEL, {
  service: SalesChannelModuleService,
})
