import {
  IOrderModuleService,
  RegisterOrderShipmentDTO,
} from "@8medusa/framework/types"
import { Modules } from "@8medusa/framework/utils"
import { StepResponse, createStep } from "@8medusa/framework/workflows-sdk"

export const registerOrderShipmentStepId = "register-order-shipment"
/**
 * This step registers a shipment for an order.
 */
export const registerOrderShipmentStep = createStep(
  registerOrderShipmentStepId,
  async (data: RegisterOrderShipmentDTO, { container }) => {
    const service = container.resolve<IOrderModuleService>(Modules.ORDER)

    await service.registerShipment(data)
    return new StepResponse(void 0, data.order_id)
  },
  async (orderId, { container }) => {
    if (!orderId) {
      return
    }

    const service = container.resolve<IOrderModuleService>(Modules.ORDER)

    await service.revertLastVersion(orderId)
  }
)
