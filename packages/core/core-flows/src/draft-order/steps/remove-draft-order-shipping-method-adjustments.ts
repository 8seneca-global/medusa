import { Modules } from "@8medusa/framework/utils"
import { StepResponse, createStep } from "@8medusa/framework/workflows-sdk"
import { IOrderModuleService } from "@8medusa/types"

export const removeDraftOrderShippingMethodAdjustmentsStepId =
  "remove-draft-order-shipping-method-adjustments"

interface RemoveDraftOrderShippingMethodAdjustmentsStepInput {
  shippingMethodAdjustmentIdsToRemove: string[]
}

export const removeDraftOrderShippingMethodAdjustmentsStep = createStep(
  removeDraftOrderShippingMethodAdjustmentsStepId,
  async function (
    data: RemoveDraftOrderShippingMethodAdjustmentsStepInput,
    { container }
  ) {
    const { shippingMethodAdjustmentIdsToRemove = [] } = data

    if (!shippingMethodAdjustmentIdsToRemove?.length) {
      return new StepResponse(void 0, [])
    }

    const service = container.resolve<IOrderModuleService>(Modules.ORDER)

    await service.deleteOrderShippingMethodAdjustments(
      shippingMethodAdjustmentIdsToRemove
    )

    return new StepResponse(void 0, shippingMethodAdjustmentIdsToRemove)
  },
  async function (shippingMethodAdjustmentIdsToRemove, { container }) {
    const service = container.resolve<IOrderModuleService>(Modules.ORDER)

    if (!shippingMethodAdjustmentIdsToRemove?.length) {
      return
    }

    await service.restoreOrderShippingMethodAdjustments(
      shippingMethodAdjustmentIdsToRemove
    )
  }
)
