import { StoreProductTagResponse } from "@8medusa/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@8medusa/framework/utils"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@8medusa/framework/http"

import { StoreProductTagParamsType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<StoreProductTagParamsType>,
  res: MedusaResponse<StoreProductTagResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "product_tag",
    filters: {
      id: req.params.id,
    },
    fields: req.queryConfig.fields,
  })

  if (!data.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product tag with id: ${req.params.id} was not found`
    )
  }
  res.json({ product_tag: data[0] })
}
