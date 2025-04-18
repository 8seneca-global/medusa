import { createAndCompleteReturnOrderWorkflow } from "@8medusa/core-flows"
import { MedusaRequest, MedusaResponse } from "@8medusa/framework/http"
import { HttpTypes } from "@8medusa/framework/types"

export const POST = async (
  req: MedusaRequest<HttpTypes.StoreCreateReturn>,
  res: MedusaResponse<HttpTypes.StoreReturnResponse>
) => {
  const input = req.validatedBody as HttpTypes.StoreCreateReturn

  const workflow = createAndCompleteReturnOrderWorkflow(req.scope)
  const { result } = await workflow.run({
    input,
  })

  res.status(200).json({ return: result as HttpTypes.StoreReturn })
}
