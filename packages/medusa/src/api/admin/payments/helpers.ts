import { MedusaContainer } from "@8medusa/framework/types"
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@8medusa/framework/utils"

export const refetchPayment = async (
  paymentId: string,
  scope: MedusaContainer,
  fields: string[]
) => {
  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const queryObject = remoteQueryObjectFromString({
    entryPoint: "payment",
    variables: {
      filters: { id: paymentId },
    },
    fields: fields,
  })

  const payments = await remoteQuery(queryObject)
  return payments[0]
}
