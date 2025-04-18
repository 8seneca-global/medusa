import { linkCustomersToCustomerGroupWorkflow } from "@8medusa/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@8medusa/framework/http"

import { HttpTypes, LinkMethodRequest } from "@8medusa/framework/types"
import { refetchCustomerGroup } from "../../helpers"

export const POST = async (
  req: AuthenticatedMedusaRequest<LinkMethodRequest>,
  res: MedusaResponse<HttpTypes.AdminCustomerGroupResponse>
) => {
  const { id } = req.params
  const { add, remove } = req.validatedBody

  const workflow = linkCustomersToCustomerGroupWorkflow(req.scope)
  await workflow.run({
    input: {
      id,
      add,
      remove,
    },
  })

  const customerGroup = await refetchCustomerGroup(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )
  res.status(200).json({ customer_group: customerGroup })
}
