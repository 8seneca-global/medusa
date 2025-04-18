import { StoreModuleService } from "@services"
import { Module, Modules } from "@8medusa/framework/utils"

export default Module(Modules.STORE, {
  service: StoreModuleService,
})
