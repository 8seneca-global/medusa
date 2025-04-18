import { ModuleExports } from "@8medusa/types"
import { ModuleService } from "./services/module-service"
import { Module } from "@8medusa/utils"

const moduleExports: ModuleExports = {
  service: ModuleService,
}

export * from "./services/module-service"

export default Module("module-with-providers", moduleExports)
