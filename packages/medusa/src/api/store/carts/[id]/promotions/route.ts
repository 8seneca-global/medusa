import { updateCartPromotionsWorkflow } from "@8medusa/core-flows"
import { PromotionActions } from "@8medusa/framework/utils"
import { MedusaRequest, MedusaResponse } from "@8medusa/framework/http"
import { refetchCart } from "../../helpers"
import { HttpTypes } from "@8medusa/framework/types"

export const POST = async (
  req: MedusaRequest<HttpTypes.StoreCartAddPromotion>,
  res: MedusaResponse<HttpTypes.StoreCartResponse>
) => {
  const workflow = updateCartPromotionsWorkflow(req.scope)
  const payload = req.validatedBody

  await workflow.run({
    input: {
      promo_codes: payload.promo_codes,
      cart_id: req.params.id,
      action: PromotionActions.ADD,
    },
  })

  const cart = await refetchCart(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ cart })
}

export const DELETE = async (
  req: MedusaRequest<HttpTypes.StoreCartRemovePromotion>,
  res: MedusaResponse<{
    cart: HttpTypes.StoreCart
  }>
) => {
  const workflow = updateCartPromotionsWorkflow(req.scope)
  const payload = req.validatedBody

  await workflow.run({
    input: {
      promo_codes: payload.promo_codes,
      cart_id: req.params.id,
      action: PromotionActions.REMOVE,
    },
  })

  const cart = await refetchCart(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ cart })
}
