import { AdminProduct } from "@8medusa/types"

export interface AdminExtendedProduct
  extends Omit<AdminProduct, "categories" | "variants" | "product_addition"> {
  product_addition: {
    long_description: string
  }
}
