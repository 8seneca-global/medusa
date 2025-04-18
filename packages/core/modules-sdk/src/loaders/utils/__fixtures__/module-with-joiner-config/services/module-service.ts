import { IModuleService, ModuleJoinerConfig } from "@8medusa/types"
import { defineJoinerConfig } from "@8medusa/utils"

export class ModuleService implements IModuleService {
  __joinerConfig(): ModuleJoinerConfig {
    return defineJoinerConfig("module-service", {
      alias: [
        {
          name: ["custom_name"],
          entity: "Custom",
        },
      ],
    })
  }
}
