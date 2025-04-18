import { updateTaxLinesWorkflow } from "@8medusa/core-flows"
import { MedusaRequest, MedusaResponse } from "@8medusa/framework/http"
import { HttpTypes } from "@8medusa/framework/types"
import { refetchCart } from "../../helpers"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse<HttpTypes.StoreCartResponse>
) => {
  await updateTaxLinesWorkflow(req.scope).run({
    input: {
      cart_id: req.params.id,
      force_tax_calculation: true,
    },
  })

  const cart = await refetchCart(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ cart })
}
