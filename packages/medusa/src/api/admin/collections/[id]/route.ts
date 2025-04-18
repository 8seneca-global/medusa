import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@8medusa/framework/http"
import {
  deleteCollectionsWorkflow,
  updateCollectionsWorkflow,
} from "@8medusa/core-flows"

import { AdminUpdateCollectionType } from "../validators"
import { refetchCollection } from "../helpers"
import { HttpTypes } from "@8medusa/framework/types"
import { MedusaError } from "@8medusa/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminCollectionResponse>
) => {
  const collection = await refetchCollection(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ collection })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateCollectionType>,
  res: MedusaResponse<HttpTypes.AdminCollectionResponse>
) => {
  const existingCollection = await refetchCollection(req.params.id, req.scope, [
    "id",
  ])
  if (!existingCollection) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Collection with id "${req.params.id}" not found`
    )
  }

  await updateCollectionsWorkflow(req.scope).run({
    input: {
      selector: { id: req.params.id },
      update: req.validatedBody,
    },
  })

  const collection = await refetchCollection(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ collection })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminCollectionDeleteResponse>
) => {
  const id = req.params.id

  await deleteCollectionsWorkflow(req.scope).run({
    input: { ids: [id] },
  })

  res.status(200).json({
    id,
    object: "collection",
    deleted: true,
  })
}
