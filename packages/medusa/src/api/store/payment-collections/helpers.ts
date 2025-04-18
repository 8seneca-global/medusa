import {
  MedusaContainer,
  PaymentCollectionDTO,
} from "@8medusa/framework/types"
import { refetchEntity } from "@8medusa/framework/http"

export const refetchPaymentCollection = async (
  id: string,
  scope: MedusaContainer,
  fields: string[]
): Promise<PaymentCollectionDTO> => {
  return refetchEntity("payment_collection", id, scope, fields)
}
