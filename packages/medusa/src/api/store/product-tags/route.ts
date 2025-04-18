import { HttpTypes } from "@8medusa/framework/types"
import { ContainerRegistrationKeys } from "@8medusa/framework/utils"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@8medusa/framework/http"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.StoreProductTagListParams>,
  res: MedusaResponse<HttpTypes.StoreProductTagListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: product_tags, metadata } = await query.graph({
    entity: "product_tag",
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
    fields: req.queryConfig.fields,
  })

  res.json({
    product_tags,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
