import { convertDraftOrderWorkflow } from "@8medusa/core-flows"
import { MedusaRequest, MedusaResponse } from "@8medusa/framework/http"
import { ContainerRegistrationKeys } from "@8medusa/framework/utils"
import { HttpTypes } from "@8medusa/types"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await convertDraftOrderWorkflow(req.scope).run({
    input: {
      id: req.params.id,
    },
  })

  const result = await query.graph({
    entity: "orders",
    filters: { id: req.params.id },
    fields: req.queryConfig.fields,
  })

  res.status(200).json({ order: result.data[0] as HttpTypes.AdminOrder })
}
