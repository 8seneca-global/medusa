import {
  removeDraftOrderActionItemWorkflow,
  updateDraftOrderActionItemWorkflow,
} from "@8medusa/core-flows"
import { AuthenticatedMedusaRequest, MedusaResponse } from "@8medusa/framework"
import { HttpTypes } from "@8medusa/types"
import { AdminUpdateDraftOrderItemType } from "../../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateDraftOrderItemType>,
  res: MedusaResponse
) => {
  const { id, action_id } = req.params

  const { result } = await updateDraftOrderActionItemWorkflow(req.scope).run({
    input: {
      data: req.validatedBody,
      order_id: id,
      action_id,
    },
  })

  res.json({
    draft_order_preview: result as unknown as HttpTypes.AdminOrderPreview,
  })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id, action_id } = req.params

  const { result } = await removeDraftOrderActionItemWorkflow(req.scope).run({
    input: {
      order_id: id,
      action_id,
    },
  })

  res.json({
    draft_order_preview: result as unknown as HttpTypes.AdminOrderPreview,
  })
}
