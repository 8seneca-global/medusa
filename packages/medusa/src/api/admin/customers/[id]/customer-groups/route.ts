import { linkCustomerGroupsToCustomerWorkflow } from "@8medusa/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@8medusa/framework/http"

import { HttpTypes, LinkMethodRequest } from "@8medusa/framework/types"

import { refetchCustomer } from "../../helpers"

export const POST = async (
  req: AuthenticatedMedusaRequest<LinkMethodRequest>,
  res: MedusaResponse<HttpTypes.AdminCustomerResponse>
) => {
  const { id } = req.params
  const { add, remove } = req.validatedBody

  const workflow = linkCustomerGroupsToCustomerWorkflow(req.scope)
  await workflow.run({
    input: {
      id,
      add,
      remove,
    },
  })

  const customer = await refetchCustomer(id, req.scope, req.queryConfig.fields)

  res.status(200).json({ customer: customer })
}
