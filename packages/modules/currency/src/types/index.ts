import { IEventBusModuleService, Logger } from "@8medusa/framework/types"

export type InitializeModuleInjectableDependencies = {
  logger?: Logger
  EventBus?: IEventBusModuleService
}
