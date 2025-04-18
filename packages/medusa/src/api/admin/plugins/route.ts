import { MedusaRequest, MedusaResponse } from "@8medusa/framework/http"
import { HttpTypes } from "@8medusa/framework/types"
import { ContainerRegistrationKeys } from "@8medusa/framework/utils"
import { isString } from "lodash"

export const GET = async (
  req: MedusaRequest<unknown>,
  res: MedusaResponse<HttpTypes.AdminPluginsListResponse>
) => {
  const configModule = req.scope.resolve(
    ContainerRegistrationKeys.CONFIG_MODULE
  )

  const configPlugins = configModule.plugins ?? []

  const plugins = configPlugins.map((plugin) => ({
    name: isString(plugin) ? plugin : plugin.resolve,
  }))

  res.json({
    plugins,
  })
}
