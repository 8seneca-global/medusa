import { Module, Modules } from "@8medusa/framework/utils"
import { OrderModuleService } from "@services"

export default Module(Modules.ORDER, {
  service: OrderModuleService,
})
