import { deleteFulfillmentSetsWorkflow } from "@8medusa/core-flows"
import { HttpTypes } from "@8medusa/framework/types"

import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@8medusa/framework/http"

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminFulfillmentSetDeleteResponse>
) => {
  const { id } = req.params

  await deleteFulfillmentSetsWorkflow(req.scope).run({
    input: { ids: [id] },
  })

  res.status(200).json({
    id,
    object: "fulfillment_set",
    deleted: true,
  })
}
