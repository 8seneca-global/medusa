import { createFulfillmentWorkflow } from "@8medusa/core-flows"
import { HttpTypes } from "@8medusa/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@8medusa/framework/http"
import { refetchFulfillment } from "./helpers"
import { AdminCreateFulfillmentType } from "./validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateFulfillmentType>,
  res: MedusaResponse<HttpTypes.AdminFulfillmentResponse>
) => {
  const { result: fullfillment } = await createFulfillmentWorkflow(
    req.scope
  ).run({
    input: {
      ...req.validatedBody,
      created_by: req.auth_context.actor_id,
    },
  })

  const fulfillment = await refetchFulfillment(
    fullfillment.id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ fulfillment })
}
