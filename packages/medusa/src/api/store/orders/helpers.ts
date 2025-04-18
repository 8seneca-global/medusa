import { MedusaContainer } from "@8medusa/framework/types"
import { refetchEntity } from "@8medusa/framework/http"

export const refetchOrder = async (
  idOrFilter: string | object,
  scope: MedusaContainer,
  fields: string[]
) => {
  return await refetchEntity("order", idOrFilter, scope, fields)
}
