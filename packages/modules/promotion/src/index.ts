import { Module, Modules } from "@8medusa/framework/utils"
import { PromotionModuleService } from "@services"

export default Module(Modules.PROMOTION, {
  service: PromotionModuleService,
})
