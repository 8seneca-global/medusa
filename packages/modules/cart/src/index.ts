import { Module, Modules } from "@8medusa/framework/utils"
import { CartModuleService } from "./services"

export default Module(Modules.CART, {
  service: CartModuleService,
})
