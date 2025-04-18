import { updateCartWorkflow } from "@8medusa/core-flows"
import {
  AdditionalData,
  HttpTypes,
  UpdateCartDataDTO,
} from "@8medusa/framework/types"

import { MedusaRequest, MedusaResponse } from "@8medusa/framework/http"
import { refetchCart } from "../helpers"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse<HttpTypes.StoreCartResponse>
) => {
  const cart = await refetchCart(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  res.json({ cart })
}

export const POST = async (
  req: MedusaRequest<UpdateCartDataDTO & AdditionalData>,
  res: MedusaResponse<{
    cart: HttpTypes.StoreCart
  }>
) => {
  const workflow = updateCartWorkflow(req.scope)

  await workflow.run({
    input: {
      ...req.validatedBody,
      id: req.params.id,
    },
  })

  const cart = await refetchCart(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ cart })
}
