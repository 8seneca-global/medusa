import { MedusaContainer } from "@8medusa/framework/types"
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@8medusa/framework/utils"

export const refetchUser = async (
  userId: string,
  scope: MedusaContainer,
  fields: string[]
) => {
  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const queryObject = remoteQueryObjectFromString({
    entryPoint: "user",
    variables: {
      filters: { id: userId },
    },
    fields: fields,
  })

  const users = await remoteQuery(queryObject)
  return users[0]
}
