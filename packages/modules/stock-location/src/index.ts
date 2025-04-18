import { Module, Modules } from "@8medusa/framework/utils"
import { StockLocationModuleService } from "@services"

export default Module(Modules.STOCK_LOCATION, {
  service: StockLocationModuleService,
})
