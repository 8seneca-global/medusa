import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntity,
} from "@8medusa/framework/http"
import { MedusaError } from "@8medusa/framework/utils"
import { AdminClaimResponse } from "@8medusa/framework/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<AdminClaimResponse>
) => {
  const claim = await refetchEntity(
    "order_claim",
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  if (!claim) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Claim with id: ${req.params.id} was not found`
    )
  }

  res.status(200).json({ claim })
}
