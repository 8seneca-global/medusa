import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@8medusa/framework/http"
import { HttpTypes } from "@8medusa/framework/types"
import { remapKeysForProduct } from "../helpers"
import { exportProductsWorkflow } from "@8medusa/core-flows"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminExportProductResponse>
) => {
  const selectFields = remapKeysForProduct(req.queryConfig.fields ?? [])
  const input = { select: selectFields, filter: req.filterableFields }

  const { transaction } = await exportProductsWorkflow(req.scope).run({
    input,
  })

  res.status(202).json({ transaction_id: transaction.transactionId })
}
