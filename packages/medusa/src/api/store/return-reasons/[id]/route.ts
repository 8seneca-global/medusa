import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@8medusa/framework/utils"
import { MedusaRequest, MedusaResponse } from "@8medusa/framework/http"
import { StoreReturnReasonParamsType } from "../validators"
import { HttpTypes } from "@8medusa/framework/types"

export const GET = async (
  req: MedusaRequest<StoreReturnReasonParamsType>,
  res: MedusaResponse<HttpTypes.StoreReturnReasonResponse>
) => {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  const variables = { id: req.params.id }

  const queryObject = remoteQueryObjectFromString({
    entryPoint: "return_reason",
    variables,
    fields: req.queryConfig.fields,
  })

  const [return_reason] = await remoteQuery(queryObject)

  res.json({ return_reason })
}
