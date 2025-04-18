import { StoreProductCategoryResponse } from "@8medusa/framework/types"
import { MedusaError } from "@8medusa/framework/utils"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntity,
} from "@8medusa/framework/http"
import { StoreProductCategoryParamsType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<StoreProductCategoryParamsType>,
  res: MedusaResponse<StoreProductCategoryResponse>
) => {
  const category = await refetchEntity(
    "product_category",
    { id: req.params.id, ...req.filterableFields },
    req.scope,
    req.queryConfig.fields
  )

  if (!category) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product category with id: ${req.params.id} was not found`
    )
  }
  res.json({ product_category: category })
}
