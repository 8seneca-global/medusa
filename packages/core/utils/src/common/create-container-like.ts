import { ContainerLike } from "@8medusa/types"

export function createContainerLike(obj): ContainerLike {
  return {
    resolve(key: string) {
      return obj[key]
    },
  }
}
