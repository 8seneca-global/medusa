import {
  deleteReturnReasonsWorkflow,
  updateReturnReasonsWorkflow,
} from "@8medusa/core-flows"
import { AdminReturnReasonResponse, HttpTypes } from "@8medusa/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  remoteQueryObjectFromString,
} from "@8medusa/framework/utils"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntity,
} from "@8medusa/framework/http"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<AdminReturnReasonResponse>
) => {
  const return_reason = await refetchEntity(
    "return_reason",
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  if (!return_reason) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Return reason with id: ${req.params.id} was not found`
    )
  }

  res.json({ return_reason })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminUpdateReturnReason>,
  res: MedusaResponse<AdminReturnReasonResponse>
) => {
  const workflow = updateReturnReasonsWorkflow(req.scope)

  const { id } = req.params
  const input = {
    selector: { id },
    update: req.validatedBody,
  }

  const { result } = await workflow.run({ input })

  const variables = { id: result[0].id }

  const queryObject = remoteQueryObjectFromString({
    entryPoint: "return_reason",
    variables,
    fields: req.queryConfig.fields,
  })

  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const [return_reason] = await remoteQuery(queryObject)

  res.json({ return_reason })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminReturnReasonDeleteResponse>
) => {
  const { id } = req.params

  const workflow = deleteReturnReasonsWorkflow(req.scope)

  const input = {
    ids: [id],
  }
  await workflow.run({ input })

  res.json({
    id,
    object: "return_reason",
    deleted: true,
  })
}
