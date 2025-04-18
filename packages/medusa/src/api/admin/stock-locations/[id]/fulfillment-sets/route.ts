import { createLocationFulfillmentSetWorkflow } from "@8medusa/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@8medusa/framework/http"
import { refetchStockLocation } from "../../helpers"
import { AdminCreateStockLocationFulfillmentSetType } from "../../validators"
import { HttpTypes } from "@8medusa/framework/types"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateStockLocationFulfillmentSetType>,
  res: MedusaResponse<HttpTypes.AdminStockLocationResponse>
) => {
  await createLocationFulfillmentSetWorkflow(req.scope).run({
    input: {
      location_id: req.params.id,
      fulfillment_set_data: {
        name: req.validatedBody.name,
        type: req.validatedBody.type,
      },
    },
  })

  const stockLocation = await refetchStockLocation(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ stock_location: stockLocation })
}
