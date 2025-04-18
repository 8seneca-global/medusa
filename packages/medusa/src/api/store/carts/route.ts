import { createCartWorkflow } from "@8medusa/core-flows"
import {
  AdditionalData,
  CreateCartWorkflowInputDTO,
  HttpTypes,
} from "@8medusa/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@8medusa/framework/http"
import { refetchCart } from "./helpers"

export const POST = async (
  req: AuthenticatedMedusaRequest<HttpTypes.StoreCreateCart & AdditionalData>,
  res: MedusaResponse<HttpTypes.StoreCartResponse>
) => {
  const workflowInput = {
    ...req.validatedBody,
    customer_id: req.auth_context?.actor_id,
  }

  const { result } = await createCartWorkflow(req.scope).run({
    input: workflowInput as CreateCartWorkflowInputDTO,
  })

  const cart = await refetchCart(result.id, req.scope, req.queryConfig.fields)

  res.status(200).json({ cart })
}
