import {
  IEventBusModuleService,
  Logger,
  StoreTypes,
} from "@8medusa/framework/types"

export type InitializeModuleInjectableDependencies = {
  logger?: Logger
  EventBus?: IEventBusModuleService
}

export type UpdateStoreInput = StoreTypes.UpdateStoreDTO & { id: string }
