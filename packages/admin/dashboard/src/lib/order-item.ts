import { OrderLineItemDTO } from "@8medusa/types"

export const getFulfillableQuantity = (item: OrderLineItemDTO) => {
  return item.quantity - item.detail.fulfilled_quantity
}
