import { Module, Modules } from "@8medusa/framework/utils"
import { ApiKeyModuleService } from "@services"

export default Module(Modules.API_KEY, {
  service: ApiKeyModuleService,
})
