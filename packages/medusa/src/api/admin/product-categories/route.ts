import { createProductCategoriesWorkflow } from "@8medusa/core-flows"
import { HttpTypes } from "@8medusa/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntities,
} from "@8medusa/framework/http"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminProductCategoryListParams>,
  res: MedusaResponse<HttpTypes.AdminProductCategoryListResponse>
) => {
  const { rows: product_categories, metadata } = await refetchEntities(
    "product_category",
    req.filterableFields,
    req.scope,
    req.queryConfig.fields,
    req.queryConfig.pagination
  )

  res.json({
    product_categories,
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminCreateProductCategory>,
  res: MedusaResponse<HttpTypes.AdminProductCategoryResponse>
) => {
  const { additional_data, ...product_categories } = req.validatedBody as any

  const { result } = await createProductCategoriesWorkflow(req.scope).run({
    input: { product_categories: [product_categories], additional_data },
  })

  const [category] = await refetchEntities(
    "product_category",
    { id: result[0].id, ...req.filterableFields },
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ product_category: category })
}
