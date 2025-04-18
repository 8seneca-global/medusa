import InventoryModuleService from "./services/inventory-module"
import { Module, Modules } from "@8medusa/framework/utils"

export default Module(Modules.INVENTORY, {
  service: InventoryModuleService,
})
