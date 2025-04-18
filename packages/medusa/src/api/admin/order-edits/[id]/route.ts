import { cancelBeginOrderEditWorkflow } from "@8medusa/core-flows"
import { HttpTypes } from "@8medusa/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@8medusa/framework/http"

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminOrderEditDeleteResponse>
) => {
  const { id } = req.params

  await cancelBeginOrderEditWorkflow(req.scope).run({
    input: {
      order_id: id,
    },
  })

  res.status(200).json({
    id,
    object: "order-edit",
    deleted: true,
  })
}
