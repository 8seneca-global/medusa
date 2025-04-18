import { addDraftOrderItemsWorkflow } from "@8medusa/core-flows"
import { AuthenticatedMedusaRequest, MedusaResponse } from "@8medusa/framework"
import { HttpTypes } from "@8medusa/types"
import { AdminAddDraftOrderItemsType } from "../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminAddDraftOrderItemsType>,
  res: MedusaResponse
) => {
  const { id } = req.params

  const { result } = await addDraftOrderItemsWorkflow(req.scope).run({
    input: {
      ...req.validatedBody,
      order_id: id,
    },
  })

  res.json({
    draft_order_preview: result as unknown as HttpTypes.AdminOrderPreview,
  })
}
