import {
  ContainerRegistrationKeys,
  MedusaError,
  remoteQueryObjectFromString,
} from "@8medusa/framework/utils"
import { MedusaRequest, MedusaResponse } from "@8medusa/framework/http"
import { HttpTypes } from "@8medusa/framework/types"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse<HttpTypes.AdminCurrencyResponse>
) => {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  const variables = { filters: { code: req.params.code } }

  const queryObject = remoteQueryObjectFromString({
    entryPoint: "currency",
    variables,
    fields: req.queryConfig.fields,
  })

  const [currency] = await remoteQuery(queryObject)
  if (!currency) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Currency with code: ${req.params.code} was not found`
    )
  }

  res.status(200).json({ currency })
}
