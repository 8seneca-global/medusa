import {
  IOrderModuleService,
  UpdateOrderChangeDTO,
} from "@8medusa/framework/types"
import {
  Modules,
  getSelectsAndRelationsFromObjectArray,
} from "@8medusa/framework/utils"
import { StepResponse, createStep } from "@8medusa/framework/workflows-sdk"

/**
 * The order changes to update.
 */
export type UpdateOrderChangesStepInput = UpdateOrderChangeDTO[]

export const updateOrderChangesStepId = "update-order-changes"
/**
 * This step updates order change.
 */
export const updateOrderChangesStep = createStep(
  updateOrderChangesStepId,
  async (data: UpdateOrderChangesStepInput, { container }) => {
    const service = container.resolve<IOrderModuleService>(Modules.ORDER)

    const { selects, relations } = getSelectsAndRelationsFromObjectArray(data, {
      objectFields: ["metadata"],
    })

    const dataBeforeUpdate = await service.listOrderChanges(
      { id: data.map((d) => d.id) },
      { relations, select: selects }
    )

    const updated = await service.updateOrderChanges(data)

    return new StepResponse(updated, dataBeforeUpdate)
  },
  async (dataBeforeUpdate, { container }) => {
    if (!dataBeforeUpdate?.length) {
      return
    }

    const service = container.resolve<IOrderModuleService>(Modules.ORDER)

    await service.updateOrderChanges(dataBeforeUpdate as UpdateOrderChangeDTO[])
  }
)
