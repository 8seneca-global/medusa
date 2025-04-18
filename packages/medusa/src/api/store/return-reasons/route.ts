import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@8medusa/framework/utils"
import { MedusaRequest, MedusaResponse } from "@8medusa/framework/http"
import { HttpTypes } from "@8medusa/framework/types"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse<HttpTypes.StoreReturnReasonListResponse>
) => {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  const queryObject = remoteQueryObjectFromString({
    entryPoint: "return_reason",
    variables: {
      filters: {
        ...req.filterableFields,
      },
      ...req.queryConfig.pagination,
    },
    fields: req.queryConfig.fields,
  })

  const { rows: return_reasons, metadata } = await remoteQuery(queryObject)

  res.json({
    return_reasons,
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  })
}
