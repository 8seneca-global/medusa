import { deleteOrderPaymentCollections } from "@8medusa/core-flows"
import { HttpTypes } from "@8medusa/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@8medusa/framework/http"

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminDeletePaymentCollectionResponse>
) => {
  const { id } = req.params

  await deleteOrderPaymentCollections(req.scope).run({
    input: { id },
  })

  res.status(200).json({
    id,
    object: "payment-collection",
    deleted: true,
  })
}
