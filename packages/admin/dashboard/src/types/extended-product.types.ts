import { BaseProduct } from "@8medusa/types/dist/http/product/common"

export interface AdminExtendedProduct
  extends Omit<BaseProduct, "categories" | "variants" | "product_addition"> {
  product_addition: {
    long_description?: string
    product_position?: number
    id: string
    created_at?: string
    updated_at?: string
  }
}
