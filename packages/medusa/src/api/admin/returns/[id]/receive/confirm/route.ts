import { confirmReturnReceiveWorkflow } from "@8medusa/core-flows"
import { HttpTypes } from "@8medusa/framework/types"
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@8medusa/framework/utils"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@8medusa/framework/http"
import { AdminPostReturnsConfirmRequestReqSchemaType } from "../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminPostReturnsConfirmRequestReqSchemaType>,
  res: MedusaResponse<HttpTypes.AdminReturnPreviewResponse>
) => {
  const { id } = req.params

  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  const { result } = await confirmReturnReceiveWorkflow(req.scope).run({
    input: {
      return_id: id,
      confirmed_by: req.auth_context.actor_id,
    },
  })

  const queryObject = remoteQueryObjectFromString({
    entryPoint: "return",
    variables: {
      id,
      filters: {
        ...req.filterableFields,
      },
    },
    fields: req.queryConfig.fields,
  })

  const [orderReturn] = await remoteQuery(queryObject)

  res.json({
    order_preview: result as unknown as HttpTypes.AdminOrderPreview,
    return: orderReturn,
  })
}
