import { Modules } from "@8medusa/framework/utils"
import { createStep, StepResponse } from "@8medusa/framework/workflows-sdk"
import { IOrderModuleService, OrderDTO } from "@8medusa/types"

interface GetDraftOrderPromotionContextStepInput {
  order: OrderDTO
}

export const getDraftOrderPromotionContextStep = createStep(
  "get-draft-order-promotion-context",
  async ({ order }: GetDraftOrderPromotionContextStepInput, { container }) => {
    const service = container.resolve<IOrderModuleService>(Modules.ORDER)

    const preview = await service.previewOrderChange(order.id)

    const orderWithPreviewItemsAndAShipping: OrderDTO = {
      ...order,
      items: preview.items,
      shipping_methods: preview.shipping_methods,
    }

    return new StepResponse(orderWithPreviewItemsAndAShipping)
  }
)
