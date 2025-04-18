import { UserModuleService } from "@services"
import { Module, Modules } from "@8medusa/framework/utils"

export default Module(Modules.USER, {
  service: UserModuleService,
})
