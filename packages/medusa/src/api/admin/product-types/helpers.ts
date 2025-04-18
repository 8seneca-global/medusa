import { MedusaContainer } from "@8medusa/framework/types"
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@8medusa/framework/utils"

export const refetchProductType = async (
  productTypeId: string,
  scope: MedusaContainer,
  fields: string[]
) => {
  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const queryObject = remoteQueryObjectFromString({
    entryPoint: "product_type",
    variables: {
      filters: { id: productTypeId },
    },
    fields: fields,
  })

  const productTypes = await remoteQuery(queryObject)
  return productTypes[0]
}
