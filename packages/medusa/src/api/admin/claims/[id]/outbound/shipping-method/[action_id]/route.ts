import {
  removeClaimShippingMethodWorkflow,
  updateClaimShippingMethodWorkflow,
} from "@8medusa/core-flows"
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@8medusa/framework/utils"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@8medusa/framework/http"
import { AdminPostClaimsShippingActionReqSchemaType } from "../../../../validators"
import { HttpTypes } from "@8medusa/framework/types"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminPostClaimsShippingActionReqSchemaType>,
  res: MedusaResponse<HttpTypes.AdminClaimPreviewResponse>
) => {
  const { id, action_id } = req.params

  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  const { result } = await updateClaimShippingMethodWorkflow(req.scope).run({
    input: {
      data: { ...req.validatedBody },
      claim_id: id,
      action_id,
    },
  })

  const queryObject = remoteQueryObjectFromString({
    entryPoint: "order_claim",
    variables: {
      id,
      filters: {
        ...req.filterableFields,
      },
    },
    fields: req.queryConfig.fields,
  })

  const [orderClaim] = await remoteQuery(queryObject)

  res.json({
    order_preview: result as unknown as HttpTypes.AdminOrderPreview,
    claim: orderClaim,
  })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminClaimPreviewResponse>
) => {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  const { id, action_id } = req.params

  const { result: orderPreview } = await removeClaimShippingMethodWorkflow(
    req.scope
  ).run({
    input: {
      claim_id: id,
      action_id,
    },
  })

  const queryObject = remoteQueryObjectFromString({
    entryPoint: "order_claim",
    variables: {
      id,
      filters: {
        ...req.filterableFields,
      },
    },
    fields: req.queryConfig.fields,
  })
  const [orderClaim] = await remoteQuery(queryObject)

  res.json({
    order_preview: orderPreview as unknown as HttpTypes.AdminOrderPreview,
    claim: orderClaim,
  })
}
