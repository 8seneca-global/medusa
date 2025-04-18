import { CustomerModuleService } from "@services"
import { Module, Modules } from "@8medusa/framework/utils"

export default Module(Modules.CUSTOMER, {
  service: CustomerModuleService,
})
