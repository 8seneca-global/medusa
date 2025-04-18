import { revokeApiKeysWorkflow } from "@8medusa/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@8medusa/framework/http"
import { AdminRevokeApiKeyType } from "../../validators"
import { refetchApiKey } from "../../helpers"
import { HttpTypes } from "@8medusa/framework/types"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminRevokeApiKeyType>,
  res: MedusaResponse<HttpTypes.AdminApiKeyResponse>
) => {
  await revokeApiKeysWorkflow(req.scope).run({
    input: {
      selector: { id: req.params.id },
      revoke: {
        ...req.validatedBody,
        revoked_by: req.auth_context.actor_id,
      },
    },
  })

  const apiKey = await refetchApiKey(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ api_key: apiKey })
}
