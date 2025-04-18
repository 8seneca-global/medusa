import { createOrderFulfillmentWorkflow } from "@8medusa/core-flows"
import { AdditionalData, HttpTypes } from "@8medusa/framework/types"
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@8medusa/framework/utils"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@8medusa/framework/http"
import { AdminOrderCreateFulfillmentType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<
    AdminOrderCreateFulfillmentType & AdditionalData
  >,
  res: MedusaResponse<HttpTypes.AdminOrderResponse>
) => {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  await createOrderFulfillmentWorkflow(req.scope).run({
    input: {
      ...req.validatedBody,
      order_id: req.params.id,
    },
  })

  const queryObject = remoteQueryObjectFromString({
    entryPoint: "order",
    variables: { id: req.params.id },
    fields: req.queryConfig.fields,
  })

  const [order] = await remoteQuery(queryObject)
  res.status(200).json({ order })
}
