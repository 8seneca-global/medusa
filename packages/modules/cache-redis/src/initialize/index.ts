import { MedusaModule } from "@8medusa/framework/modules-sdk"
import {
  ExternalModuleDeclaration,
  ICacheService,
  InternalModuleDeclaration,
} from "@8medusa/framework/types"
import { Modules } from "@8medusa/framework/utils"
import { RedisCacheModuleOptions } from "../types"

export const initialize = async (
  options?: RedisCacheModuleOptions | ExternalModuleDeclaration
): Promise<ICacheService> => {
  const serviceKey = Modules.CACHE
  const loaded = await MedusaModule.bootstrap<ICacheService>({
    moduleKey: serviceKey,
    defaultPath: "@8medusa/cache-redis",
    declaration: options as
      | InternalModuleDeclaration
      | ExternalModuleDeclaration,
  })

  return loaded[serviceKey]
}
