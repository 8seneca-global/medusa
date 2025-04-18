import { Module, Modules } from "@8medusa/framework/utils"
import { ProductModuleService } from "@services"

export default Module(Modules.PRODUCT, {
  service: ProductModuleService,
})
