import { capturePaymentWorkflow } from "@8medusa/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@8medusa/framework/http"
import { refetchPayment } from "../../helpers"
import { AdminCreatePaymentCaptureType } from "../../validators"
import { HttpTypes } from "@8medusa/framework/types"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreatePaymentCaptureType>,
  res: MedusaResponse<HttpTypes.AdminPaymentResponse>
) => {
  const { id } = req.params

  await capturePaymentWorkflow(req.scope).run({
    input: {
      payment_id: id,
      captured_by: req.auth_context.actor_id,
      amount: req.validatedBody.amount,
    },
  })

  const payment = await refetchPayment(id, req.scope, req.queryConfig.fields)

  res.status(200).json({ payment })
}
