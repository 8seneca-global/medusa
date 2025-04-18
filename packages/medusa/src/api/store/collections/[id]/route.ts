import { HttpTypes } from "@8medusa/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@8medusa/framework/http"
import { refetchCollection } from "../helpers"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.StoreCollectionResponse>
) => {
  const collection = await refetchCollection(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ collection })
}
