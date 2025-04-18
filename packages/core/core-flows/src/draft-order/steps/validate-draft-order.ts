import { MedusaError, OrderStatus } from "@8medusa/framework/utils"
import { createStep } from "@8medusa/framework/workflows-sdk"
import { OrderDTO } from "@8medusa/types"

interface ValidateDraftOrderStepInput {
  order: OrderDTO
}

export const validateDraftOrderStep = createStep(
  "validate-draft-order",
  async function ({ order }: ValidateDraftOrderStepInput) {
    if (order.status !== OrderStatus.DRAFT && !order.is_draft_order) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Order ${order.id} is not a draft order`
      )
    }
  }
)
