import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@8medusa/framework/http"

import { linkProductsToSalesChannelWorkflow } from "@8medusa/core-flows"
import { HttpTypes, LinkMethodRequest } from "@8medusa/framework/types"
import { refetchSalesChannel } from "../../helpers"

export const POST = async (
  req: AuthenticatedMedusaRequest<LinkMethodRequest>,
  res: MedusaResponse<HttpTypes.AdminSalesChannelResponse>
) => {
  const { id } = req.params
  const { add, remove } = req.validatedBody

  const workflow = linkProductsToSalesChannelWorkflow(req.scope)
  await workflow.run({
    input: {
      id,
      add,
      remove,
    },
  })

  const salesChannel = await refetchSalesChannel(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )
  res.status(200).json({ sales_channel: salesChannel })
}
