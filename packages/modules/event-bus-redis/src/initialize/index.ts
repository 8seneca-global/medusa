import { MedusaModule } from "@8medusa/framework/modules-sdk"
import {
  ExternalModuleDeclaration,
  IEventBusService,
  InternalModuleDeclaration,
} from "@8medusa/framework/types"
import { Modules } from "@8medusa/framework/utils"
import { EventBusRedisModuleOptions } from "../types"

export const initialize = async (
  options?: EventBusRedisModuleOptions | ExternalModuleDeclaration
): Promise<IEventBusService> => {
  const serviceKey = Modules.EVENT_BUS
  const loaded = await MedusaModule.bootstrap<IEventBusService>({
    moduleKey: serviceKey,
    defaultPath: "@8medusa/event-bus-redis",
    declaration: options as
      | InternalModuleDeclaration
      | ExternalModuleDeclaration,
  })

  return loaded[serviceKey]
}
