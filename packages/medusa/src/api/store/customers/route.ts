import { MedusaError } from "@8medusa/framework/utils"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@8medusa/framework/http"

import { createCustomerAccountWorkflow } from "@8medusa/core-flows"
import { HttpTypes } from "@8medusa/framework/types"
import { refetchCustomer } from "./helpers"

export const POST = async (
  req: AuthenticatedMedusaRequest<HttpTypes.StoreCreateCustomer>,
  res: MedusaResponse<HttpTypes.StoreCustomerResponse>
) => {
  // If `actor_id` is present, the request carries authentication for an existing customer
  if (req.auth_context.actor_id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Request already authenticated as a customer."
    )
  }

  const createCustomers = createCustomerAccountWorkflow(req.scope)
  const customerData = req.validatedBody

  const { result } = await createCustomers.run({
    input: { customerData, authIdentityId: req.auth_context.auth_identity_id },
  })

  const customer = await refetchCustomer(
    result.id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ customer })
}
