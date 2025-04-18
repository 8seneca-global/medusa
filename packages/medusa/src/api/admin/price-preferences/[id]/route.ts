import {
  deletePricePreferencesWorkflow,
  updatePricePreferencesWorkflow,
} from "@8medusa/core-flows"

import { HttpTypes } from "@8medusa/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntity,
} from "@8medusa/framework/http"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminPricePreferenceResponse>
) => {
  const price_preference = await refetchEntity(
    "price_preference",
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ price_preference })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminUpdatePricePreference>,
  res: MedusaResponse<HttpTypes.AdminPricePreferenceResponse>
) => {
  const id = req.params.id
  const workflow = updatePricePreferencesWorkflow(req.scope)

  await workflow.run({
    input: { selector: { id: [id] }, update: req.body },
  })

  const price_preference = await refetchEntity(
    "price_preference",
    id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ price_preference })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminPricePreferenceDeleteResponse>
) => {
  const id = req.params.id
  const workflow = deletePricePreferencesWorkflow(req.scope)

  await workflow.run({
    input: [id],
  })

  res.status(200).json({
    id,
    object: "price_preference",
    deleted: true,
  })
}
