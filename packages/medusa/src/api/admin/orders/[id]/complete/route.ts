import { AdditionalData, HttpTypes } from "@8medusa/framework/types"
import { completeOrderWorkflow } from "@8medusa/core-flows"
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@8medusa/framework/utils"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@8medusa/framework/http"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdditionalData>,
  res: MedusaResponse<HttpTypes.AdminOrderResponse>
) => {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const { id } = req.params

  await completeOrderWorkflow(req.scope).run({
    input: {
      orderIds: [id],
      additional_data: req.validatedBody.additional_data,
    },
  })

  const queryObject = remoteQueryObjectFromString({
    entryPoint: "order",
    variables: { id },
    fields: req.queryConfig.fields,
  })

  const [order] = await remoteQuery(queryObject)

  res.status(200).json({ order })
}
