import { ChangeActionType, MedusaError } from "@8medusa/framework/utils"
import { createStep } from "@8medusa/framework/workflows-sdk"
import {
  OrderChangeActionDTO,
  OrderChangeDTO,
  OrderWorkflow,
} from "@8medusa/types"

export interface ValidateDraftOrderShippingMethodActionStepInput {
  input: OrderWorkflow.DeleteOrderEditShippingMethodWorkflowInput
  orderChange: OrderChangeDTO
}

export const validateDraftOrderShippingMethodActionStep = createStep(
  "validate-draft-order-shipping-method-action",
  async function ({
    input,
    orderChange,
  }: ValidateDraftOrderShippingMethodActionStepInput) {
    const associatedAction = (orderChange.actions ?? []).find(
      (a) => a.id === input.action_id
    ) as OrderChangeActionDTO

    if (!associatedAction) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `No shipping method found for order ${input.order_id} in order change ${orderChange.id}`
      )
    }

    if (associatedAction.action !== ChangeActionType.SHIPPING_ADD) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Action ${associatedAction.id} is not adding a shipping method`
      )
    }
  }
)
