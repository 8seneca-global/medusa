import { HttpTypes } from "@8medusa/types"

export type CreateCategoryPayload = HttpTypes.AdminCreateProductCategory & {
  additional_data?: {
    type: "category" | "collection"
  }
}
