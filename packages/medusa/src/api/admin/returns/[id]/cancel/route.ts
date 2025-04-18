import { cancelReturnWorkflow } from "@8medusa/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@8medusa/framework/http"
import { AdminPostCancelReturnReqSchemaType } from "../../validators"
import { HttpTypes } from "@8medusa/framework/types"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminPostCancelReturnReqSchemaType>,
  res: MedusaResponse<HttpTypes.AdminReturnResponse>
) => {
  const { id } = req.params

  const workflow = cancelReturnWorkflow(req.scope)
  const { result } = await workflow.run({
    input: {
      ...req.validatedBody,
      return_id: id,
    },
  })

  res.status(200).json({ return: result as HttpTypes.AdminReturn })
}
