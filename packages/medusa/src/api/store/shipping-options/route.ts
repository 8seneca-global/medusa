import { listShippingOptionsForCartWorkflow } from "@8medusa/core-flows"
import { MedusaRequest, MedusaResponse } from "@8medusa/framework/http"
import { HttpTypes } from "@8medusa/framework/types"

export const GET = async (
  req: MedusaRequest<{}, HttpTypes.StoreGetShippingOptionList>,
  res: MedusaResponse<HttpTypes.StoreShippingOptionListResponse>
) => {
  const { cart_id, is_return } = req.filterableFields

  const workflow = listShippingOptionsForCartWorkflow(req.scope)
  const { result: shipping_options } = await workflow.run({
    input: { cart_id, is_return: !!is_return },
  })

  res.json({ shipping_options })
}
