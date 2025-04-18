import { MedusaModule } from "@8medusa/framework/modules-sdk"
import { IEventBusService } from "@8medusa/framework/types"
import { Modules } from "@8medusa/framework/utils"

export const initialize = async (): Promise<IEventBusService> => {
  const serviceKey = Modules.EVENT_BUS
  const loaded = await MedusaModule.bootstrap<IEventBusService>({
    moduleKey: serviceKey,
    defaultPath: "@8medusa/event-bus-local",
  })

  return loaded[serviceKey]
}
