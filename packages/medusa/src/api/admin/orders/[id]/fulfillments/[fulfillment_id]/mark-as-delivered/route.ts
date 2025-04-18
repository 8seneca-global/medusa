import { markOrderFulfillmentAsDeliveredWorkflow } from "@8medusa/core-flows"
import { HttpTypes } from "@8medusa/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntity,
} from "@8medusa/framework/http"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminOrderResponse>
) => {
  const { id: orderId, fulfillment_id: fulfillmentId } = req.params

  await markOrderFulfillmentAsDeliveredWorkflow(req.scope).run({
    input: { orderId, fulfillmentId },
  })

  const order = await refetchEntity(
    "order",
    orderId,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ order })
}
