import { HttpTypes } from "@8medusa/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@8medusa/framework/http"
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@8medusa/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminPaymentProviderFilters>,
  res: MedusaResponse<HttpTypes.AdminPaymentProviderListResponse>
) => {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const queryObject = remoteQueryObjectFromString({
    entryPoint: "payment_provider",
    variables: {
      filters: req.filterableFields,
      ...req.queryConfig.pagination,
    },
    fields: req.queryConfig.fields,
  })

  const { rows: payment_providers, metadata } = await remoteQuery(queryObject)

  res.json({
    payment_providers,
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  })
}
