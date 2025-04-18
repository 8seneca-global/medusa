import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@8medusa/framework/http"

import { createCollectionsWorkflow } from "@8medusa/core-flows"
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@8medusa/framework/utils"
import { AdminCreateCollectionType } from "./validators"
import { refetchCollection } from "./helpers"
import { HttpTypes } from "@8medusa/framework/types"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminCollectionListParams>,
  res: MedusaResponse<HttpTypes.AdminCollectionListResponse>
) => {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  const query = remoteQueryObjectFromString({
    entryPoint: "product_collection",
    variables: {
      filters: req.filterableFields,
      ...req.queryConfig.pagination,
    },
    fields: req.queryConfig.fields,
  })

  const { rows: collections, metadata } = await remoteQuery(query)

  res.json({
    collections,
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateCollectionType>,
  res: MedusaResponse<HttpTypes.AdminCollectionResponse>
) => {
  const input = [
    {
      ...req.validatedBody,
    },
  ]

  const { result } = await createCollectionsWorkflow(req.scope).run({
    input: { collections: input },
  })

  const collection = await refetchCollection(
    result[0].id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ collection })
}
