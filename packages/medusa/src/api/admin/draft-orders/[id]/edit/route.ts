import {
  beginDraftOrderEditWorkflow,
  cancelDraftOrderEditWorkflow,
} from "@8medusa/core-flows"
import { AuthenticatedMedusaRequest, MedusaResponse } from "@8medusa/framework"
import { HttpTypes } from "@8medusa/types"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  const { result } = await beginDraftOrderEditWorkflow(req.scope).run({
    input: {
      order_id: id,
    },
  })

  res.json({
    draft_order_preview: result as unknown as HttpTypes.AdminDraftOrderPreview,
  })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  await cancelDraftOrderEditWorkflow(req.scope).run({
    input: {
      order_id: id,
    },
  })

  res.status(200).json({
    id,
    object: "draft-order-edit",
    deleted: true,
  })
}
