import { createOrderPaymentCollectionWorkflow } from "@8medusa/core-flows"
import { HttpTypes } from "@8medusa/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntity,
} from "@8medusa/framework/http"
import { AdminCreatePaymentCollectionType } from "./validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreatePaymentCollectionType>,
  res: MedusaResponse<HttpTypes.AdminPaymentCollectionResponse>
) => {
  const { result } = await createOrderPaymentCollectionWorkflow(req.scope).run({
    input: req.body,
  })

  const paymentCollection = await refetchEntity(
    "payment_collection",
    result[0].id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ payment_collection: paymentCollection })
}
