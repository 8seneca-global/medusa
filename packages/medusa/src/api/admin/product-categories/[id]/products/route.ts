import { batchLinkProductsToCategoryWorkflow } from "@8medusa/core-flows"
import {
  AdminProductCategoryResponse,
  LinkMethodRequest,
} from "@8medusa/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntity,
} from "@8medusa/framework/http"

export const POST = async (
  req: AuthenticatedMedusaRequest<LinkMethodRequest>,
  res: MedusaResponse<AdminProductCategoryResponse>
) => {
  const { id } = req.params

  await batchLinkProductsToCategoryWorkflow(req.scope).run({
    input: { id, ...req.validatedBody },
  })

  const category = await refetchEntity(
    "product_category",
    id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ product_category: category })
}
