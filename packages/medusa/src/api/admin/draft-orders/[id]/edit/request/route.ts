import { requestDraftOrderEditWorkflow } from "@8medusa/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@8medusa/framework/http"
import { HttpTypes } from "@8medusa/types"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  const { result } = await requestDraftOrderEditWorkflow(req.scope).run({
    input: {
      order_id: id,
      requested_by: req.auth_context.actor_id,
    },
  })

  res.json({
    draft_order_preview: result as unknown as HttpTypes.AdminOrderPreview,
  })
}
